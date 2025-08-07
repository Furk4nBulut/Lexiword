import React, { useState } from 'react';
import type { PaginationSettings } from './PaginationPlugin';

interface PaginationSettingsProps {
  settings: PaginationSettings;
  onSettingsChange: (settings: PaginationSettings) => void;
  isVisible: boolean;
  onToggle: () => void;
}

export function PaginationSettingsPanel({
  settings,
  onSettingsChange,
  isVisible,
  onToggle
}: PaginationSettingsProps): JSX.Element {
  const [localSettings, setLocalSettings] = useState(settings);

  const handleChange = (field: keyof PaginationSettings, value: number): void => {
    const newSettings = { ...localSettings, [field]: value };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const presets = {
    A4: { pageWidth: 210, pageHeight: 297 },
    A3: { pageWidth: 297, pageHeight: 420 },
    Letter: { pageWidth: 216, pageHeight: 279 },
    Legal: { pageWidth: 216, pageHeight: 356 }
  };

  const applyPreset = (preset: keyof typeof presets): void => {
    const newSettings = {
      ...localSettings,
      ...presets[preset]
    };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
  };

  if (!isVisible) {
    return (
      <button className="pagination-control-btn settings-toggle" onClick={onToggle}>
        ⚙️
      </button>
    );
  }

  return (
    <div className="page-settings">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>Sayfa Ayarları</h3>
        <button
          onClick={onToggle}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          ✕
        </button>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label>Sayfa Boyutu Önayarları:</label>
        <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
          {Object.keys(presets).map((preset) => (
            <button
              key={preset}
              onClick={() => {
                applyPreset(preset as keyof typeof presets);
              }}
              style={{
                padding: '4px 8px',
                border: '1px solid #d1d1d1',
                borderRadius: '2px',
                background: 'white',
                cursor: 'pointer',
                fontSize: '10px'
              }}
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      <label>
        Genişlik (mm):
        <input
          type="number"
          value={localSettings.pageWidth}
          onChange={(e) => {
            handleChange('pageWidth', Number(e.target.value));
          }}
          min="100"
          max="500"
        />
      </label>

      <label>
        Yükseklik (mm):
        <input
          type="number"
          value={localSettings.pageHeight}
          onChange={(e) => {
            handleChange('pageHeight', Number(e.target.value));
          }}
          min="100"
          max="700"
        />
      </label>

      <label>
        Üst Kenar Boşluğu (mm):
        <input
          type="number"
          value={localSettings.marginTop}
          onChange={(e) => {
            handleChange('marginTop', Number(e.target.value));
          }}
          min="5"
          max="50"
        />
      </label>

      <label>
        Alt Kenar Boşluğu (mm):
        <input
          type="number"
          value={localSettings.marginBottom}
          onChange={(e) => {
            handleChange('marginBottom', Number(e.target.value));
          }}
          min="5"
          max="50"
        />
      </label>

      <label>
        Sol Kenar Boşluğu (mm):
        <input
          type="number"
          value={localSettings.marginLeft}
          onChange={(e) => {
            handleChange('marginLeft', Number(e.target.value));
          }}
          min="5"
          max="50"
        />
      </label>

      <label>
        Sağ Kenar Boşluğu (mm):
        <input
          type="number"
          value={localSettings.marginRight}
          onChange={(e) => {
            handleChange('marginRight', Number(e.target.value));
          }}
          min="5"
          max="50"
        />
      </label>

      <div style={{ marginTop: '12px', fontSize: '10px', color: '#666' }}>
        Ctrl+Enter: Yeni sayfa ekle
      </div>
    </div>
  );
}
