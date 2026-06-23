import React, { useState } from 'react';
import { KitVisualizer } from './KitVisualizer';

interface TeamKit {
  angle: number;
  textColour: number;
  teamColour1: number;
  teamColour2?: number | null;
  teamColour3?: number | null;
}

interface Team {
  tit?: TeamKit;
  alt?: TeamKit;
}

interface TeamEditorProps {
  teamName: string;
  team: Team;
  onSave: (teamName: string, team: Team) => void;
  onCancel: () => void;
}

export const TeamEditor: React.FC<TeamEditorProps> = ({ teamName, team, onSave, onCancel }) => {
  const [editedTeam, setEditedTeam] = useState<Team>(team);

  const hexToNumber = (hex: string): number => {
    return parseInt(hex.replace('#', ''), 16);
  };

  const numberToHex = (num: number): string => {
    return `#${num.toString(16).padStart(6, '0')}`;
  };

  const updateKit = (kitType: 'tit' | 'alt', field: keyof TeamKit, value: any) => {
    setEditedTeam(prev => ({
      ...prev,
      [kitType]: {
        ...prev[kitType],
        [field]: value
      }
    }));
  };

  const addColor = (kitType: 'tit' | 'alt') => {
    const kit = editedTeam[kitType];
    if (!kit) return;

    if (!kit.teamColour2) {
      updateKit(kitType, 'teamColour2', 16777215); // White
    } else if (!kit.teamColour3) {
      updateKit(kitType, 'teamColour3', 16777215); // White
    }
  };

  const removeColor = (kitType: 'tit' | 'alt') => {
    const kit = editedTeam[kitType];
    if (!kit) return;

    if (kit.teamColour3) {
      updateKit(kitType, 'teamColour3', null);
    } else if (kit.teamColour2) {
      updateKit(kitType, 'teamColour2', null);
    }
  };

  const createKit = (kitType: 'tit' | 'alt') => {
    setEditedTeam(prev => ({
      ...prev,
      [kitType]: {
        angle: 90,
        textColour: 16777215,
        teamColour1: 16777215,
        teamColour2: null,
        teamColour3: null
      }
    }));
  };

  const deleteKit = (kitType: 'tit' | 'alt') => {
    setEditedTeam(prev => {
      const newTeam = { ...prev };
      delete newTeam[kitType];
      return newTeam;
    });
  };

  const renderKitEditor = (kitType: 'tit' | 'alt', label: string) => {
    const kit = editedTeam[kitType];

    if (!kit) {
      return (
        <div className="border rounded-lg p-4">
          <h4 className="font-semibold mb-2">{label}</h4>
          <button
            onClick={() => createKit(kitType)}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            Create {label}
          </button>
        </div>
      );
    }

    return (
      <div className="border rounded-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-semibold">{label}</h4>
          <div className="flex gap-2">
            <button
              onClick={() => deleteKit(kitType)}
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-sm"
            >
              Delete
            </button>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Angle</label>
              <input
                type="range"
                min="0"
                max="360"
                value={kit.angle}
                onChange={(e) => updateKit(kitType, 'angle', parseInt(e.target.value))}
                className="w-full"
              />
              <span className="text-sm text-gray-600">{kit.angle}°</span>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Text Color</label>
              <input
                type="color"
                value={numberToHex(kit.textColour)}
                onChange={(e) => updateKit(kitType, 'textColour', hexToNumber(e.target.value))}
                className="w-full h-10"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Color 1</label>
              <input
                type="color"
                value={numberToHex(kit.teamColour1)}
                onChange={(e) => updateKit(kitType, 'teamColour1', hexToNumber(e.target.value))}
                className="w-full h-10"
              />
            </div>

            {kit.teamColour2 !== null && kit.teamColour2 !== undefined && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Color 2</label>
                <input
                  type="color"
                  value={numberToHex(kit.teamColour2)}
                  onChange={(e) => updateKit(kitType, 'teamColour2', hexToNumber(e.target.value))}
                  className="w-full h-10"
                />
              </div>
            )}

            {kit.teamColour3 !== null && kit.teamColour3 !== undefined && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Color 3</label>
                <input
                  type="color"
                  value={numberToHex(kit.teamColour3)}
                  onChange={(e) => updateKit(kitType, 'teamColour3', hexToNumber(e.target.value))}
                  className="w-full h-10"
                />
              </div>
            )}

            <div className="flex gap-2">
              {(!kit.teamColour2 || !kit.teamColour3) && (
                <button
                  onClick={() => addColor(kitType)}
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded text-sm"
                >
                  Add Color
                </button>
              )}
              {(kit.teamColour2 || kit.teamColour3) && (
                <button
                  onClick={() => removeColor(kitType)}
                  className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-1 px-2 rounded text-sm"
                >
                  Remove Color
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-col items-center">
            <label className="block text-sm font-medium mb-2">Preview</label>
            <KitVisualizer kit={kit} size={100} showText={true} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Edit Team: {teamName}</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {renderKitEditor('tit', 'Titular Kit')}
          {renderKitEditor('alt', 'Alternative Kit')}
        </div>

        <div className="flex justify-end gap-4">
          <button
            onClick={onCancel}
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(teamName, editedTeam)}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};