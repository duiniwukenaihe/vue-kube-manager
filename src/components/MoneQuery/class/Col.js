/**
 * Col 列
 */
export default class Col {
  constructor(data = {}) {
    this.label = data.label
    this.prop = data.prop
    this.width = data.width
    this.type = data.type
    this.elType = data.elType
    this.valueFormat = data.valueFormat
    this.order = data.order
    this.action = data.action
    this.placeholder = data.placeholder
    this.fixed = data.fixed
    this.options = data.options
  }
  static TYPES = {
    text: 'el-input',
    autocomplete: 'el-autocomplete',
    option: 'MoneOptions',
    date: 'el-date-picker',
    datetime: 'el-date-picker'
    // bit: 'el-checkbox',
    // int: 'el-input-number',
    // time: 'el-time-picker',
  }
  hasType() {
    return Object.prototype.hasOwnProperty.call(Col.TYPES, this.type)
  }
}
