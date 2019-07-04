export const SUPPORTED_EXTENSIONS = [
  'jpg',
  'png',
  'gif',
  'webp',
  'bmp'
]

export const KEY_COMBO_COOLDOWN = 500
export const DEFAULT_COLUMNS = 6
export const DEFAULT_CONTAIN = true

export const OPEN_DIALOG_OPTIONS = [
  'openFile',
  'openDirectory',
  'multiSelections'
]

export const STORE_SCHEMA = {
  columns: {
    type: 'number',
    default: DEFAULT_COLUMNS
  },
  contain: {
    type: 'boolean',
    default: DEFAULT_CONTAIN
  }
}
