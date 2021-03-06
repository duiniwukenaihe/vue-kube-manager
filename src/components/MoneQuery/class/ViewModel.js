import request from '@/utils/request'

var __awaiter =
  (this && this.__awaiter) ||
  function(thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function(resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value))
        } catch (e) {
          reject(e)
        }
      }
      function rejected(value) {
        try {
          step(generator['throw'](value))
        } catch (e) {
          reject(e)
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : new P(function(resolve) {
            resolve(result.value)
          }).then(fulfilled, rejected)
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next())
    })
  }

const CONFIG = {
  pageSize: 20,
  pageIndex: 1,
  pageName: 'page',
  sizeName: 'pageSize',
  rowsName: 'result',
  totalName: 'total',
  instanceName: 'data'
}
/**
 * 视图模型
 */
export default class ViewModel {
  constructor(data, flag = true) {
    this.loading = false
    this.visible = false
    if (data) {
      if (flag) {
        Object.assign(this, data)
      } else {
        Object.keys(this).forEach(key => {
          if (key && Object.prototype.hasOwnProperty.call(data, key)) {
            this[key] = data[key]
          }
        })
      }
    }
  }
}
// 列表视图
export class ListView extends ViewModel {
  constructor(data) {
    super()
    this.needPage = true
    this.rows = []
    this.total = 0
    this.rowsName = CONFIG.rowsName
    this.totalName = CONFIG.totalName
    this.pageName = CONFIG.pageName
    this.sizeName = CONFIG.sizeName
    this.pageIndex = CONFIG.pageIndex
    this.pageSize = CONFIG.pageSize
    this.parameters
    if (data) {
      Object.keys(data).forEach(k => {
        if (data[k]) {
          this[k] = data[k]
        }
      })
    }
    this.initParameters()
  }
  initParameters() {
    this.parameters = {
      colProps: [],
      params: {},
      sort: [],
      page: {
        [this.pageName]: this.pageIndex,
        [this.sizeName]: this.pageSize
      },
      dataMethod: 'post'
    }
  }
  load() {
    return __awaiter(this, arguments, void 0, function * () {
      try {
        const args = Array.from(arguments)
        this.loading = true
        const url = args.shift()
        const originParams = args.shift()
        const dataMethod = args.shift()
        const params = {}
        Object.assign(params, originParams.page)
        for (let i = 0, len = originParams.params.length; i < len; i++) {
          params[originParams.params[i].field] = (originParams.params[i].value)
        }
        let res
        if (dataMethod.toLowerCase() === 'get') {
          res = yield request({
            url: url,
            method: dataMethod,
            params: params
          })
        } else {
          res = yield request({
            url: url,
            method: dataMethod,
            data: params
          })
        }
        this.rows = getDeepProp(res, this.rowsName.split('.'))
        this.total = getDeepProp(res, this.totalName.split('.'))
        return Promise.resolve(res)
      } catch (error) {
        this.rows = []
        this.total = 0
        return Promise.reject(error)
      } finally {
        this.loading = false
      }
    })
  }
}
// 详情视图
export class DetailView extends ViewModel {
  constructor(data) {
    super()
    this.instance = {}
    this.deleting = false
    this.instanceName = CONFIG.instanceName
    if (data) {
      Object.assign(this, data)
    }
  }
  clone() {
    return JSON.parse(JSON.stringify(this.instance))
  }
  delete() {
    return __awaiter(this, arguments, void 0, function * () {
      try {
        const args = Array.from(arguments)
        var req = args.shift()
        this.deleting = true
        const res = yield req.apply(req, args)
        return Promise.resolve(res)
      } catch (error) {
        console.info('DetailView delete data error', error)
        return Promise.reject(error)
      } finally {
        this.deleting = false
      }
    })
  }
  load() {
    return __awaiter(this, arguments, void 0, function * () {
      try {
        const args = Array.from(arguments)
        var req = args.shift()
        this.loading = true
        const res = yield req.apply(req, args)
        this.instance = res[this.instanceName]
        return Promise.resolve(res)
      } catch (error) {
        console.info('DetailView load data error', error)
        return Promise.reject(error)
      } finally {
        this.loading = false
      }
    })
  }
}
// 表单视图
export class FormView extends DetailView {
  constructor(data) {
    super()
    this.rules = {}
    this.editing = false
    this.submitting = false
    if (data) {
      Object.assign(this, data)
    }
  }
  submit() {
    const args = Array.from(arguments)
    var req = args.shift()
    return new Promise((resolve, reject) => {
      this.submitting = true
      req
        .apply(req, args)
        .then(res => {
          this.submitting = false
          resolve(res)
        })
        .catch(err => {
          this.submitting = false
          reject(err)
        })
    })
  }
}

export class Param {
  constructor(data = {}) {
    this.field = data.field
    this.action = data.action
    this.fieldType = data.fieldType
    this.value = data.value
  }
}

export const getDeepProp = (a, props) => {
  try {
    if (props.length) {
      const p = props.shift()
      return getDeepProp(a[p], props)
    } else {
      return a
    }
  } catch (error) {
    return a
  }
}
