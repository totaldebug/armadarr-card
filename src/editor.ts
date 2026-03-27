import { LitElement, html, TemplateResult, css, CSSResultGroup } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { HomeAssistant, LovelaceCardEditor } from 'custom-card-helpers';

const fireEvent = (node: HTMLElement, type: string, detail?: any, options?: any) => {
  options = options || {};
  detail = detail === null || detail === undefined ? {} : detail;
  const event = new CustomEvent(type, {
    bubbles: options.bubbles === undefined ? true : options.bubbles,
    cancelable: Boolean(options.cancelable),
    composed: options.composed === undefined ? true : options.composed,
    detail,
  });
  node.dispatchEvent(event);
  return event;
};

const SCHEMA = [
  { name: "entity", required: true, selector: { entity: { filter: { domain: "sensor" } } } },
  { name: "title", selector: { text: {} } },
  {
    name: "image_style",
    selector: {
      select: {
        mode: "dropdown",
        options: [
          { value: "poster", label: "Poster" },
          { value: "fanart", label: "Fanart" }
        ]
      }
    }
  },
  { name: "max", selector: { number: { min: 1, max: 50, mode: "box" } } },
  { name: "collapse", selector: { number: { min: 1, max: 50, mode: "box" } } },
  { name: "url_pattern", selector: { text: {} } },
  { name: "relative_time", selector: { boolean: {} } },
];

const defaults = {
  image_style: 'poster',
  max: 5,
  collapse: 5,
  relative_time: false,
};

@customElement('armadarr-card-editor')
export class ArmadarrCardEditor extends LitElement implements LovelaceCardEditor {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @state() private _config?: any;
  @state() private _helpers?: any;
  private _initialized = false;

  public setConfig(config: any): void {
    console.log('Armadarr Card Editor: setConfig', config);
    this._config = { ...defaults, ...config };
    this.loadCardHelpers();
    this.requestUpdate();
  }

  protected shouldUpdate(): boolean {
    return true;
  }

  private async loadCardHelpers(): Promise<void> {
    if (this._helpers) return;
    console.log('Armadarr Card Editor: loadCardHelpers');
    
    if (!(window as any).loadCardHelpers) {
      console.warn('Armadarr Card Editor: window.loadCardHelpers not found, retrying in 500ms...');
      setTimeout(() => this.loadCardHelpers(), 500);
      return;
    }

    try {
      this._helpers = await (window as any).loadCardHelpers();
      console.log('Armadarr Card Editor: Helpers loaded successfully', !!this._helpers);
      if (this._helpers) {
        this._helpers.createCardElement({ type: 'entity', entity: 'sun.sun' });
      }
      this.requestUpdate();
    } catch (e) {
      console.error('Armadarr Card Editor: Error loading card helpers', e);
    }
  }

  async connectedCallback() {
    super.connectedCallback();
    console.log('Armadarr Card Editor: connectedCallback');
    await this._ensureFormComponents();
  }

  async _ensureFormComponents() {
    if (customElements.get('ha-form')) return;
    console.log('Armadarr Card Editor: ensuring ha-form');
    try {
      const helpers = await (window as any).loadCardHelpers?.();
      if (helpers) await helpers.createCardElement({ type: 'entity', entity: 'sun.sun' });
    } catch (_) {}
  }

  protected render(): TemplateResult | void {
    console.log('Armadarr Card Editor: Rendering', {
      hass: !!this.hass,
      config: !!this._config,
      helpers: !!this._helpers
    });

    if (!this.hass || !this._config) {
      return html`
        <div>
          Loading... 
          (Hass: ${this.hass ? 'OK' : 'Missing'}, 
          Config: ${this._config ? 'OK' : 'Missing'})
        </div>
      `;
    }

    return html`
      <ha-card>
        <div class="card-config">
          <div class="sponsor">
            <div class="sponsor-text">
              Please consider sponsoring this project. <br />
              This will help keep the project alive and continue development.
            </div>
            <div class="badge">
              <a href="https://github.com/sponsors/marksie1988" target="_blank">
                <img
                  src="https://img.shields.io/badge/sponsor-000?style=for-the-badge&logo=githubsponsors&logoColor=red"
                />
              </a>
            </div>
          </div>

          ${this._helpers ? html`
            <ha-expansion-panel .header=${'Main Settings'} outlined expanded>
              <div slot="header" class="title">Main Settings</div>
              <div class="values">
                <ha-form
                  .hass=${this.hass}
                  .data=${this._config}
                  .schema=${SCHEMA}
                  .computeLabel=${this._computeLabel}
                  @value-changed=${this._valueChanged}
                ></ha-form>
              </div>
            </ha-expansion-panel>
          ` : html`<div>Loading Form Components...</div>`}
        </div>
      </ha-card>
    `;
  }

  private _computeLabel(schema: any) {
    return schema.label || schema.name.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
  }

  private _getCleanConfig(config: any): any {
    const newConfig = { ...config };
    for (const [key, value] of Object.entries(newConfig)) {
      // @ts-ignore
      if (JSON.stringify(value) === JSON.stringify(defaults[key])) {
        // @ts-ignore
        delete newConfig[key];
      }
    }
    return newConfig;
  }

  private _valueChanged(ev: CustomEvent): void {
    const config = this._getCleanConfig(ev.detail.value);
    fireEvent(this, 'config-changed', { config });
  }

  static get styles(): CSSResultGroup {
    return css`
      .card-config {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .sponsor {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px;
        background: var(--secondary-background-color);
        border-radius: 8px;
        margin-bottom: 8px;
        border: 1px solid var(--divider-color);
      }
      .sponsor-text {
        font-size: 14px;
        line-height: 1.4;
      }
      .badge img {
        display: block;
        height: 28px;
      }
      .title {
        font-size: 16px;
        font-weight: bold;
      }
      .values {
        padding: 16px;
      }
      ha-expansion-panel {
        display: block;
        --expansion-panel-content-padding: 0;
      }
    `;
  }
}
