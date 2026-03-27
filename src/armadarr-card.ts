import { LitElement, html, css, PropertyValues, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { HomeAssistant, LovelaceCard, LovelaceCardEditor } from 'custom-card-helpers';

interface ArmadarrMediaItem {
  id: number;
  title: string;
  poster?: string;
  fanart?: string;
  airdate?: string;
  number?: string;
  episode?: string;
  summary?: string;
  genres?: string;
  studio?: string;
  rating?: number;
  trailer?: string;
}

interface ArmadarrCardConfig {
  type: string;
  entity: string;
  title?: string;
  image_style?: 'poster' | 'fanart';
  max?: number;
  collapse?: number;
  url_pattern?: string;
  relative_time?: boolean;
}

const defaults: Partial<ArmadarrCardConfig> = {
  image_style: 'poster',
  max: 5,
  collapse: 5,
  relative_time: false,
};

@customElement('armadarr-card')
export class ArmadarrCard extends LitElement implements LovelaceCard {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @state() private config!: ArmadarrCardConfig;
  @state() private _collapsed = true;
  @state() private _requesting: Record<number, boolean> = {};
  @state() private _requested: Record<number, boolean> = {};
  @state() private _errors: Record<number, boolean> = {};
  private _tooltipElement?: HTMLElement;

  public static async getConfigElement(): Promise<LovelaceCardEditor> {
    await import('./editor');
    return document.createElement('armadarr-card-editor') as any;
  }

  public static getStubConfig(): Record<string, unknown> {
    return {
      entity: '',
      ...defaults,
    };
  }

  public setConfig(config: ArmadarrCardConfig): void {
    if (!config.entity) {
      throw new Error('Please define an entity');
    }
    this.config = { ...defaults, ...config };
  }

  public getCardSize(): number {
    return 3;
  }

  public disconnectedCallback(): void {
    if (this._tooltipElement?.parentNode) {
      this._tooltipElement.parentNode.removeChild(this._tooltipElement);
    }
    super.disconnectedCallback();
  }

  protected render(): TemplateResult | void {
    if (!this.config || !this.hass) {
      return html``;
    }

    const entityId = this.config.entity;
    const stateObj = this.hass.states[entityId];

    if (!stateObj) {
      return html`
        <ha-card class="armadarr-card armadarr-error-card">
          <div class="armadarr-error">Entity not found: ${entityId}</div>
        </ha-card>
      `;
    }

    const rawData = stateObj.attributes.data;
    const type = stateObj.attributes.type;
    const entryId = stateObj.attributes.entry_id;

    let data: ArmadarrMediaItem[] = [];
    if (rawData) {
      try {
        data = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
      } catch (e) {
        console.error("Error parsing Armadarr data", e);
      }
    }

    if (!Array.isArray(data) || data.length <= 1) {
      return html`
        <ha-card class="armadarr-card armadarr-no-data">
          ${this.config.title ? html`<div class="armadarr-header">${this.config.title}</div>` : ''}
          <div class="armadarr-error">No media data available</div>
        </ha-card>
      `;
    }

    const imageStyle = this.config.image_style || 'poster';
    const maxLimit = this.config.max || 5;
    const collapseLimit = this.config.collapse || maxLimit;
    
    const mediaItems = data.slice(1, maxLimit + 1);
    const isCollapsible = mediaItems.length > collapseLimit;

    const itemsToShow = (isCollapsible && this._collapsed) 
      ? mediaItems.slice(0, collapseLimit) 
      : mediaItems;

    return html`
      <ha-card class="armadarr-card" .image_style="${imageStyle}">
        <div class="armadarr-card-container">
          <div class="armadarr-card-header">
            ${this.config.title ? html`<div class="armadarr-header">${this.config.title}</div>` : html`<div></div>`}
            ${isCollapsible ? html`
              <div class="armadarr-collapse-control" @click="${this._toggleCollapse}">
                <ha-icon class="armadarr-collapse-icon" .icon="${this._collapsed ? 'mdi:chevron-down' : 'mdi:chevron-up'}"></ha-icon>
              </div>
            ` : ''}
          </div>
          <div class="armadarr-list">
            ${itemsToShow.map(item => this._renderItem(item, type, entryId, imageStyle))}
          </div>
        </div>
      </ha-card>
    `;
  }

  private _formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;

    if (this.config.relative_time) {
      const now = new Date();
      const diffInSeconds = Math.floor((date.getTime() - now.getTime()) / 1000);
      const diffInDays = Math.floor(diffInSeconds / 86400);

      const rtf = new Intl.RelativeTimeFormat(this.hass.language || 'en', { numeric: 'auto' });

      if (Math.abs(diffInDays) < 1) {
        const diffInHours = Math.floor(diffInSeconds / 3600);
        if (Math.abs(diffInHours) < 1) {
          return rtf.format(Math.floor(diffInSeconds / 60), 'minute');
        }
        return rtf.format(diffInHours, 'hour');
      }
      if (Math.abs(diffInDays) < 30) {
        return rtf.format(diffInDays, 'day');
      }
      return rtf.format(Math.floor(diffInDays / 30), 'month');
    }

    return new Intl.DateTimeFormat(this.hass.language || 'en', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  }

  private _renderItem(item: ArmadarrMediaItem, type: string, entryId: string, imageStyle: string): TemplateResult {
    const image = imageStyle === 'poster' ? item.poster : item.fanart;
    const trailerUrl = item.trailer ? `https://www.youtube.com/watch?v=${item.trailer}` : null;
    const isRequesting = this._requesting[item.id];
    const isRequested = this._requested[item.id];
    const isError = this._errors[item.id];
    const formattedDate = item.airdate ? this._formatDate(item.airdate) : '';

    const itemContent = imageStyle === 'poster' ? html`
      <div class="armadarr-image-container">
        <img src="${image}" alt="${item.title}" class="armadarr-image">
        ${trailerUrl ? html`
          <a href="${trailerUrl}" target="_blank" class="armadarr-trailer" @click="${(e: Event) => e.stopPropagation()}">
            <ha-icon .icon=${"mdi:play-circle"} class="armadarr-trailer-icon"></ha-icon>
          </a>
        ` : ''}
      </div>
      <div class="armadarr-info">
        <div class="armadarr-title">${item.title}</div>
        <div class="armadarr-subtitle">${item.episode || ''}</div>
        <div class="armadarr-meta">
          ${formattedDate ? html`<div class="armadarr-meta-item armadarr-airdate">${formattedDate}</div>` : ''}
          ${item.number ? html`<div class="armadarr-meta-item armadarr-number">${item.number} ${item.rating ? html`<span class="armadarr-rating"> - ★ ${item.rating}</span>` : ''}</div>` : ''}
          ${item.genres ? html`<div class="armadarr-meta-item armadarr-genres">${item.genres}</div>` : ''}
        </div>
      </div>
    ` : html`
      <div class="armadarr-fanart-container" style="background-image: url(${image})">
        <div class="armadarr-fanart-fade"></div>
      </div>
      <div class="armadarr-info">
        <div class="armadarr-title">${item.title}</div>
        <div class="armadarr-subtitle">${formattedDate ? `Available ${formattedDate}` : ''}</div>
        <div class="armadarr-meta">
          ${item.rating ? html`<div class="armadarr-meta-item armadarr-rating-studio"><span class="armadarr-rating">★ ${item.rating}</span> - <span class="armadarr-studio">${item.studio || ''}</span></div>` : ''}
          ${item.genres ? html`<div class="armadarr-meta-item armadarr-genres">${item.genres}</div>` : ''}
        </div>
      </div>
      ${trailerUrl ? html`
        <a href="${trailerUrl}" target="_blank" class="armadarr-trailer" @click="${(e: Event) => e.stopPropagation()}">
          <ha-icon .icon=${"mdi:play-circle"} class="armadarr-trailer-icon"></ha-icon>
        </a>
      ` : ''}
    `;

    return html`
      <div class="armadarr-item armadarr-${imageStyle}-item" 
           style="position: relative;"
           @click="${() => this._handleItemClick(item)}"
           @mousemove="${(e: MouseEvent) => this._handleMouseMove(e, item)}"
           @mouseleave="${this._handleMouseLeave}">
        ${itemContent}
        
        ${type === 'wanted_media' ? html`
          <div 
            class="armadarr-request-action ${isRequested ? 'requested' : ''} ${isRequesting ? 'requesting' : ''} ${isError ? 'error' : ''}"
            style="position: absolute; top: 8px; right: 8px; z-index: 100; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; background: rgba(0, 0, 0, 0.6); border-radius: 50%; cursor: pointer; pointer-events: auto; border: 1px solid rgba(255,255,255,0.2);"
            @click="${(e: Event) => this._requestItem(e, entryId, item.id)}"
            title="${isError ? 'Request Failed' : (isRequested ? 'Requested' : 'Request Download')}"
          >
            ${isRequesting ? html`<ha-circular-progress class="armadarr-request-progress" active size="small" style="--mdc-theme-primary: var(--accent-color, #e5c07b);"></ha-circular-progress>` : 
              html`<ha-icon class="armadarr-request-icon" .icon="${isError ? 'mdi:alert-circle' : (isRequested ? 'mdi:check-circle' : 'mdi:cloud-download')}" style="color: ${isError ? 'var(--error-color, #f44336)' : (isRequested ? 'var(--success-color, #4caf50)' : 'var(--accent-color, #e5c07b)')};"></ha-icon>`}
          </div>
        ` : ''}
      </div>
    `;
  }

  private _handleMouseMove(e: MouseEvent, item: ArmadarrMediaItem) {
    if (!this._tooltipElement) {
      this._tooltipElement = document.createElement('div');
      this._tooltipElement.className = 'armadarr-tooltip';
      Object.assign(this._tooltipElement.style, {
        position: 'fixed',
        background: 'rgba(30, 30, 30, 0.98)',
        color: 'white',
        border: '1px solid rgba(255,255,255,0.2)',
        padding: '12px',
        zIndex: '1000000',
        width: '280px',
        borderRadius: '8px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
        pointerEvents: 'none',
        backdropFilter: 'blur(8px)',
        display: 'none',
        boxSizing: 'border-box',
        fontFamily: 'var(--paper-font-body1_-_font-family, Roboto, Noto, sans-serif)',
      });
      document.body.appendChild(this._tooltipElement);
    }

    this._tooltipElement.innerHTML = `
      <div class="armadarr-tooltip-title" style="font-weight: bold; margin-bottom: 6px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 4px; color: var(--accent-color, #e5c07b);">${item.title}</div>
      <div class="armadarr-tooltip-summary" style="font-size: 0.9em; line-height: 1.4;">${item.summary || 'No summary available'}</div>
    `;

    this._tooltipElement.style.display = 'block';
    
    let x = e.clientX + 15;
    let y = e.clientY + 15;

    // Adjust if off-screen
    if (x + 280 > window.innerWidth) {
      x = e.clientX - 295;
    }
    if (y + 150 > window.innerHeight) {
      y = e.clientY - 150;
    }

    this._tooltipElement.style.left = `${x}px`;
    this._tooltipElement.style.top = `${y}px`;
  }

  private _handleMouseLeave() {
    if (this._tooltipElement) {
      this._tooltipElement.style.display = 'none';
    }
  }

  private _handleItemClick(item: ArmadarrMediaItem): void {
    if (this.config.url_pattern) {
      let url = this.config.url_pattern;
      const replacements: Record<string, string | undefined> = {
        '{title}': item.title,
        '{id}': item.id?.toString(),
        '{airdate}': item.airdate,
        '{number}': item.number,
        '{episode}': item.episode,
        '{studio}': item.studio,
        '{genres}': item.genres,
      };

      for (const [placeholder, value] of Object.entries(replacements)) {
        if (value) {
          url = url.split(placeholder).join(encodeURIComponent(value));
        }
      }
      window.open(url, '_blank');
    }
  }

  private _toggleCollapse(): void {
    this._collapsed = !this._collapsed;
    this.requestUpdate();
  }

  private async _requestItem(e: Event, entryId: string, itemId: number): Promise<void> {
    e.stopPropagation();
    
    if (this._requesting[itemId] || this._requested[itemId]) {
      return;
    }

    this._requesting = { ...this._requesting, [itemId]: true };
    this._errors = { ...this._errors, [itemId]: false };
    this.requestUpdate();
    
    const startTime = Date.now();
    
    try {
      await this.hass.callService('armadarr', 'search_item', {
        entry_id: entryId,
        item_id: itemId
      });
      
      const elapsed = Date.now() - startTime;
      if (elapsed < 1000) {
        await new Promise(resolve => setTimeout(resolve, 1000 - elapsed));
      }
      
      this._requested = { ...this._requested, [itemId]: true };
      this.requestUpdate();
    } catch (err) {
      console.error("Armadarr Card: Error requesting item", err);
      this._errors = { ...this._errors, [itemId]: true };
      this.requestUpdate();
      setTimeout(() => {
        this._errors = { ...this._errors, [itemId]: false };
        this.requestUpdate();
      }, 4000);
    } finally {
      this._requesting = { ...this._requesting, [itemId]: false };
      this.requestUpdate();
    }
  }

  static styles = css`
    :host {
      position: relative;
      display: block;
    }
    .armadarr-card {
      height: 100%;
    }
    .armadarr-card-container {
      padding: 16px;
    }
    .armadarr-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 16px;
    }
    .armadarr-header {
      font-size: 1.5em;
      color: var(--primary-text-color);
    }
    .armadarr-collapse-control {
      cursor: pointer;
      color: var(--secondary-text-color);
      transition: color 0.2s;
      background: rgba(255,255,255,0.05);
      border-radius: 50%;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .armadarr-collapse-control:hover {
      color: var(--primary-color);
      background: rgba(255,255,255,0.1);
    }
    .armadarr-list {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .armadarr-item {
      position: relative;
      display: flex;
      cursor: pointer;
      transition: transform 0.2s;
      will-change: transform;
      outline: none;
      backface-visibility: hidden;
      -webkit-backface-visibility: hidden;
    }
    .armadarr-item:hover {
      transform: scale(1.01);
    }

    /* Poster Style */
    .armadarr-poster-item {
      flex-direction: row;
      align-items: center;
    }
    .armadarr-poster-item .armadarr-image-container {
      width: 120px;
      flex-shrink: 0;
      aspect-ratio: 2/3;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0,0,0,0.5);
      position: relative;
      z-index: 2;
    }
    .armadarr-poster-item .armadarr-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .armadarr-poster-item .armadarr-info {
      flex-grow: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
      background: linear-gradient(to right, transparent, rgba(0,0,0,0.9) 20%, rgba(0,0,0,0.9));
      margin-left: -40px;
      padding-left: 56px;
      padding-top: 12px;
      padding-bottom: 12px;
      min-height: 100px;
      justify-content: center;
      border-radius: 0 8px 8px 0;
      z-index: 1;
    }
    .armadarr-poster-item .armadarr-title {
      font-weight: bold;
      font-size: 1.2em;
      color: white;
    }
    .armadarr-poster-item .armadarr-subtitle {
      color: var(--accent-color, #e5c07b);
      font-size: 0.95em;
    }
    .armadarr-poster-item .armadarr-meta {
      color: var(--secondary-text-color);
      font-size: 0.85em;
    }

    /* Fanart Style */
    .armadarr-fanart-item {
      height: 160px;
      border-radius: 8px;
      overflow: hidden;
      background: var(--card-background-color, #1c1c1c);
      box-shadow: 0 4px 12px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.1);
      position: relative;
      box-sizing: border-box;
    }
    .armadarr-fanart-container {
      position: absolute;
      top: 0;
      right: 0;
      width: 100%;
      height: 100%;
      z-index: 0;
      background-size: cover;
      background-position: right center;
      background-repeat: no-repeat;
    }
    .armadarr-fanart-fade {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(to right, var(--card-background-color, #1c1c1c) 35%, transparent 75%);
    }
    .armadarr-fanart-item .armadarr-info {
      position: relative;
      z-index: 1;
      padding: 16px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      width: 60%;
      height: 100%;
      box-sizing: border-box;
    }
    .armadarr-fanart-item .armadarr-title {
      font-weight: bold;
      font-size: 1.4em;
      color: white;
      margin-bottom: 4px;
    }
    .armadarr-fanart-item .armadarr-subtitle {
      color: var(--secondary-text-color);
      font-size: 0.95em;
    }
    .armadarr-fanart-item .armadarr-meta {
      color: var(--secondary-text-color);
      font-size: 0.85em;
      margin-top: 4px;
    }

    /* Common Elements */
    .armadarr-trailer {
      position: absolute;
      bottom: 8px;
      right: 8px;
      color: white;
      z-index: 3;
      opacity: 0.8;
    }
    .armadarr-trailer:hover {
      opacity: 1;
    }

    .armadarr-request-action {
      transition: all 0.2s;
      backdrop-filter: blur(4px);
    }
    .armadarr-request-action:hover {
      background: rgba(0, 0, 0, 0.9) !important;
      transform: scale(1.1);
    }
    .armadarr-request-action.requested {
      cursor: default;
    }
    .armadarr-request-action.error {
      animation: shake 0.4s;
    }
    .armadarr-request-action.requesting {
      cursor: wait;
      animation: pulse 1.5s infinite;
    }
    .armadarr-request-action ha-circular-progress {
      display: block;
      width: 24px;
      height: 24px;
    }

    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 rgba(229, 192, 123, 0.4); }
      70% { box-shadow: 0 0 0 10px rgba(229, 192, 123, 0); }
      100% { box-shadow: 0 0 0 0 rgba(229, 192, 123, 0); }
    }

    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-4px); }
      75% { transform: translateX(4px); }
    }

    .armadarr-error {
      color: var(--error-color);
      padding: 16px;
      text-align: center;
    }
  `;

  protected updated(changedProps: PropertyValues): void {
    super.updated(changedProps);
    if (changedProps.has('config')) {
      this.setAttribute('image_style', this.config.image_style || 'poster');
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'armadarr-card': ArmadarrCard;
  }
}

(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
  type: 'armadarr-card',
  name: 'Armadarr Card',
  preview: true,
  description: 'The Armadarr card displays upcoming and wanted media from Armadarr integration.',
});
