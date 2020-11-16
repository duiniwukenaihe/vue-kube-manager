<template>
  <div v-loading="CONFIGLoading" class="mone-query">
    <div v-if="CONFIG" class="mone-query-body">
      <slot name="header">
        <el-row class="tool-box">
          <el-col :span="8">
            <el-button class="p-2" size="large" type="text" icon="el-icon-refresh" :loading="CONFIGLoading" @click="loadConfig()" />
            <slot name="header-left" />
          </el-col>
          <el-col :span="16" class="text-right">
            <el-button type="default" @click="resetParam()">重置</el-button>
            <el-button type="primary" icon="el-icon-search" :loading="stmt.loading" @click="stmtLoad()">
              查询
            </el-button>
            <el-button v-if="CONFIG.showDelete" type="danger" icon="el-icon-delete" @click="handleBatchDelete()">
              删除
            </el-button>
            <!--
            <el-button type="primary" :loading="stmt.exporting" @click="handleExport()">
              导出
            </el-button>
            -->
            <show-field
              v-if="CONFIG.colbox"
              ref="showFieldRef"
              v-model="showProps"
              :fields="CONFIG.cols"
              :placement="CONFIG.colbox.placement"
              :width="CONFIG.colbox.width"
              :trigger="CONFIG.colbox.trigger"
              :config="configShowFields"
            />
          </el-col>
        </el-row>
      </slot>
      <el-table
        :ref="tableId"
        :data="stmt.rows"
        :border="border"
        row-key="id"
        :height="height"
        :max-height="maxHeight"
        :show-header="CONFIG.showHeader"
        @selection-change="handleSelectionChange"
        @sort-change="handleSortChange"
      >
        <el-table-column
          v-if="CONFIG.showIndex && showProps && showProps.length"
          fixed
          :index="index => index + 1"
          type="index"
          align="center"
        />
        <el-table-column
          v-if="CONFIG.showSelection && showProps && showProps.length"
          fixed
          reserve-selection
          type="selection"
          align="center"
        />
        <el-table-column
          v-for="item in cols"
          :key="item.prop"
          min-width="150px"
          :fixed="FIXED[item.prop]"
          sortable="custom"
          :column-key="item.prop"
          :prop="item.prop"
          :width="item.width"
          :formatter="formatters[item.prop]"
        >
          <span
            slot="header"
            slot-scope="{}"
            class="cell-box"
            draggable
            :data-field="item.prop"
            @click.stop=""
            @dragstart="handleDragstart"
            @dragenter="handleDragenter"
            @dragleave="handleDragleave"
            @dragend="handleDrop"
          >
            <span>
              {{ item.label }}
              <el-button
                title="固定左侧"
                type="text"
                size="large"
                :icon="`el-icon-star-${FIXED[item.prop] ? 'on' : 'off'}`"
                @click="FIXED[item.prop] = !FIXED[item.prop]"
              />
            </span>
            <p class="param-box">
              <component
                :is="COMPONENT_NAME_MAP[item.type]"
                v-model="PARAMS[item.prop].value"
                class="inline-block"
                size="mini"
                clearable
                :fetch-suggestions="
                  (queryString, cb) => {
                    querySearchAsync(queryString, cb, item);
                  }
                "
                :value-key="item.prop"
                :options="item.options"
                :multiple="item.multiple || true"
                :trigger-on-focus="false"
                :placeholder="item.placeholder"
                :value-format="item.valueFormat"
                :type="item.elType"
                @click.native.stop=""
                @select="handleChoose"
              />
            </p>
          </span>
        </el-table-column>
        <el-table-column v-if="showAction && showProps && showProps.length" label="操作" fixed="right">
          <template slot-scope="{ row }">
            <slot :row="row" />
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        :current-page.sync="stmt.parameters.page[stmt.pageName]"
        :page-size.sync="stmt.parameters.page[stmt.sizeName]"
        :layout="CONFIG.pageLayout || 'total, prev, pager, next, sizes, ->, jumper'"
        :total="stmt.total"
        @size-change="stmtLoad()"
        @current-change="stmtLoad()"
      />
    </div>
    <div v-else class="error-box">
      <p>╮(╯▽╰)╭ &nbsp;Sorry~ loading failed...</p>
      <el-button size="large" type="text" icon="el-icon-refresh" :loading="CONFIGLoading" @click="loadConfig()">
        Retry
      </el-button>
    </div>
  </div>
</template>

<script>
import Col from '@/components/MoneQuery/class/Col'
import { ListView, Param, getDeepProp } from '@/components/MoneQuery/class/ViewModel'
import FieldGroup from '@/components/MoneQuery/class/FieldGroup'
import showField from './show-field'
import { getCurrencyConfig } from '@/api/currency-query'
// import { listUser } from '@/api/user'

export default {
  name: 'MoneQuery',
  components: {
    showField
  },
  props: {
    config: { type: [Object, String], required: true },
    data: { type: [Array, String], required: true },
    height: { type: [String, Number], default: '150px' },
    maxHeight: { type: [String, Number], default: '1500px' },
    border: { type: Boolean, default: false },
    primaryKey: { type: String, default: 'id' },
    pageLayout: { type: String, default: null },
    pageName: { type: String, default: 'pageIndex' },
    sizeName: { type: String, default: 'pageSize' },
    rowsName: { type: String, default: 'result' },
    totalName: { type: String, default: 'total' },
    colbox: { type: Object, default: null },
    visibleFields: { type: [Boolean, Array], default: true },
    visibleFieldConfig: { type: Array, default: null },
    showAction: { type: Boolean, default: false },
    showDelete: { type: Boolean, default: false },
    showHeader: { type: Boolean, default: true },
    showSelection: { type: Boolean, default: true },
    showIndex: { type: Boolean, default: false },
    formatters: {
      type: Object,
      default() {
        return {}
      }
    }
  },
  data() {
    return {
      tableId: Symbol(),
      CONFIG: null,
      PARAMS: {},
      CONFIGLoading: false,
      COMPONENT_NAME_MAP: Col.TYPES,
      stmt: new ListView(),
      showProps: [],
      configShowFields: [],
      multipleSelection: [],
      FIXED: {},
      dragField: null,
      dropField: null
    }
  },
  computed: {
    cols() {
      if (this.CONFIG.cols) {
        return this.CONFIG.cols
          .filter(x => this.showProps.includes(x.prop))
          .map(col => {
            col.valueFormat = this.getValueFormat(col)
            col.elType = this.getElType(col)
            return new Col(col)
          })
          .sort((a, b) => {
            const aa = a.order || Infinity
            const bb = b.order || Infinity
            if (aa > bb) {
              return 1
            } else if (aa < bb) {
              return -1
            } else {
              return 0
            }
          })
      }
      return []
    }
  },
  created() {
    // 加载配置
    this.loadConfig()
  },
  mounted() {},
  methods: {
    async loadConfig() {
      console.log('loadConfig...')
      if (this.CONFIGLoading) return
      try {
        this.CONFIGLoading = true
        if (typeof this.config === 'string') {
          await getCurrencyConfig(this.config).then(response => {
            console.log(response.result)
            this.CONFIG = response.result
            this.$emit('config-success', response.result)
          })
        } else {
          console.log('static config')
          this.CONFIG = this.config
        }
        this.stmt = new ListView({
          pageName: this.CONFIG.pageName,
          sizeName: this.CONFIG.sizeName,
          rowsName: this.CONFIG.rowsName,
          totalName: this.CONFIG.totalName
        })
        // 初始化外部设置
        this.initConfig()
        // 设置显示字段
        this.setShowFields()
        // 初始化查询参数
        this.resetParam()
        // 查询数据
        this.stmtLoad()
      } catch (error) {
        this.$emit('config-error', error)
      } finally {
        this.$emit('config-complete')
        this.CONFIGLoading = false
      }
    },
    initConfig() {
      console.log('initConfig...')
      console.log('CONFIG: ', this.CONFIG)
      console.log('primaryKey: ', this.CONFIG.primaryKey)
      if (this.primaryKey) this.CONFIG.primaryKey = this.primaryKey
      if (this.pageLayout) this.CONFIG.pageLayout = this.pageLayout
      if (this.pageName) this.CONFIG.pageName = this.pageName
      if (this.sizeName) this.CONFIG.sizeName = this.sizeName
      if (this.rowsName) this.CONFIG.rowsName = this.rowsName
      if (this.totalName) this.CONFIG.totalName = this.totalName
      if (this.colbox) this.CONFIG.colbox = this.colbox
      if (this.visibleFields) this.CONFIG.visibleFields = this.visibleFields
      // visibleFieldConfig 无全局配置
      if (this.visibleFieldConfig) {
        this.CONFIG.visibleFieldConfig = this.visibleFieldConfig
      }
      if (this.showAction) this.CONFIG.showAction = this.showAction
      if (this.showDelete) this.CONFIG.showDelete = this.showDelete
      if (this.showHeader) this.CONFIG.showHeader = this.showHeader
      if (this.showSelection) this.CONFIG.showSelection = this.showSelection
      if (this.showIndex) this.CONFIG.showIndex = this.showIndex
    },
    // 设置显示字段
    setShowFields() {
      console.log('setShowFields...')
      if (
        this.CONFIG.visibleFields &&
        Array.isArray(this.CONFIG.visibleFields)
      ) {
        this.showProps = this.CONFIG.visibleFields
      } else {
        this.showProps = this.CONFIG.visibleFields
          ? this.CONFIG.cols.map(x => x.prop)
          : []
      }
      // 设置字段在工具栏的显示规则
      if (this.CONFIG.visibleFieldConfig) {
        this.configShowFields = this.CONFIG.visibleFieldConfig
      } else {
        this.configShowFields.push(
          new FieldGroup({
            colProps: this.showProps
          })
        )
      }
    },
    requestUrl() {
      return '/api/currency/data?code=' + this.data
    },
    resetParam() {
      console.log('resetParam...')
      const _params = {}
      const _fixed = {}
      this.CONFIG.cols.forEach(col => {
        _params[col.prop] = new Param({
          field: col.prop,
          fieldType: col.type,
          action: this.getAction(col),
          value: this.getInitVal(col)
        })
        _fixed[col.prop] = col.fixed
      })
      this.FIXED = _fixed
      this.PARAMS = _params
    },
    getValueFormat(col) {
      if (col.valueFormat) return col.valueFormat
      switch (col.type) {
        case 'date':
          return 'yyyy-MM-dd'
        case 'datetime':
          return 'yyyy-MM-dd HH:mm:ss'
        default:
          return void 0
      }
    },
    getInitVal(col) {
      switch (col.type) {
        case 'option':
        case 'date':
        case 'datetime':
          return []
        default:
          return void 0
      }
    },
    getElType(col) {
      if (col.elType) return col.elType
      switch (col.type) {
        case 'date':
          return 'daterange'
        case 'datetime':
          return 'datetimerange'
        default:
          return void 0
      }
    },
    getAction(col) {
      if (col.action) return col.action
      switch (col.type) {
        case 'varchar':
          return 'lk'
        case 'option':
          return 'in'
        default:
          return void 0
      }
    },
    formatParams() {
      const _params = this.PARAMS
      const pars = []
      Object.keys(_params).forEach(x => {
        const field = _params[x]
        if (!field) return
        switch (field.fieldType) {
          case 'varchar':
            if (field.value) {
              pars.push(field)
            }
            break
          case 'option':
            if (field.value && field.value.length) {
              pars.push(field)
            }
            break
          case 'datetime':
          case 'date':
            if (field.value && field.value.length === 2) {
              pars.push({
                field: field.field,
                action: 'gt',
                fieldType: field.fieldType,
                value: field.value[0]
              })
              pars.push({
                field: field.field,
                action: 'lt',
                fieldType: field.fieldType,
                value: field.value[1]
              })
            }
            break
        }
      })
      return pars
    },
    async stmtLoad() {
      console.log('stmtLoad...')
      const primary = this.stmt
      if (primary.loading) return false
      primary.parameters.colProps = this.showProps
      primary.parameters.params = this.formatParams()
      this.$emit('search', primary.parameters)
      if (typeof this.data !== 'string') {
        primary.rows = this.data
        primary.total = this.data.length
        return false
      } else {
        try {
          const res = await primary.load(
            this.requestUrl(),
            primary.parameters,
            'GET'
          )
          this.$emit('data-success', res)
        } catch (e) {
          this.$emit('data-error', e)
        } finally {
          this.$emit('data-complete')
        }
      }
    },
    handleSelectionChange(val) {
      if (this.CONFIG.showHeader && this.CONFIG.showSelection) {
        this.multipleSelection = val
      }
    },
    handleChoose() {},
    async querySearchAsync(queryString, cb, field) {
      console.log('querySearchAsync...')
      if (!queryString) return cb([])
      if (typeof this.data !== 'string') {
        return cb([])
      }
      const primary = this.stmt
      primary.parameters.colProps = [field.prop]
      primary.parameters.params = [
        {
          field: field.prop,
          fieldType: field.type,
          action: this.getAction(field),
          value: queryString
        }
      ]
      getCurrencyConfig(this.config).then(response => {
        console.log(response.result)
        const res = response
        cb(getDeepProp(res, this.stmt.rowsName.split('.')))
      })
    },
    handleSortChange({ prop, order }) {
      if (this.CONFIG.showHeader && this.CONFIG.showSelection) {
        if (prop && order) {
          this.stmt.parameters.sort = [
            {
              prop,
              type: order.replace('ending', '')
            }
          ]
        } else {
          this.stmt.parameters.sort = []
        }
        this.stmtLoad()
      }
    },
    // 自定义表头
    customFieldColumn(h, { column, $index }) {
      return h()
    },
    handleBatchDelete() {
      this.$emit('delete', this.multipleSelection)
    },
    // 拖拽相关
    handleDragstart(e) {
      e.currentTarget.style.cursor = '-webkit-grabbing'
      this.dragField = e.currentTarget.dataset.field
      // console.log('drag: ', this.dragField)
    },
    handleDragenter(e) {
      if (e.currentTarget !== e.target) return
      // console.log('enter: ', e.currentTarget.dataset.field)
      e.currentTarget.style.backgroundColor = '#ebeef5'
      //   e.preventDefault()
      if (e.currentTarget.dataset.field === this.dragField) return
      this.dropField = e.currentTarget.dataset.field
    },
    handleDragleave(e) {
      if (e.currentTarget !== e.target) return
      // console.log('leave: ', e.currentTarget.dataset.field)
      e.currentTarget.style.backgroundColor = '#F2FCFD'
    },
    handleDrop(e) {
      e.currentTarget.style.cursor = '-webkit-grab'
      // console.log('drop: ', this.dropField)
      // 更新拖拽数据
      if (this.dragField && this.dropField) {
        const f = this.CONFIG.cols
        const dragItem = f.find(x => x.prop === this.dragField)
        const dropItem = f.find(x => x.prop === this.dropField)
        if (dragItem && dropItem) {
          const dragItemId = dragItem.order
          dragItem.order = dropItem.order
          dropItem.order = dragItemId
          this.$set(this.CONFIG, 'cols', f)
        }
        this.dragField = null
        this.dropField = null
      }
    }
  }
}
</script>

<style lang='scss'>
.mone-query {
  .m-l {
    margin-left: 12px;
  }
  .p-2 {
    padding: 8px;
  }
  .m-r {
    margin-left: 12px;
  }
  .text-right {
    text-align: right;
  }
  box-sizing: border-box;
  .tool-box {
    padding: 16px 0;
    background-color: white;
  }
  .error-box {
    color: #ccc;
    min-height: 220px;
    text-align: center;
    padding-top: 100px;
  }
  .bounce-enter-active {
    animation: bounce-in 0.5s;
  }
  .bounce-leave-active {
    animation: bounce-in 0.5s reverse;
  }
  .el-table th {
    vertical-align: top;
  }
  .el-table th div {
    line-height: normal;
  }
  .el-table th > .cell {
    white-space: nowrap;
    padding-right: 0;
    padding-left: 6px;
    .cell-box {
      box-sizing: border-box;
      // padding-left: 4px;
      border-radius: 2px;
      cursor: -webkit-grab;
      display: inline-block;
      width: calc(100% - 24px);
      .param-box {
        padding: 0;
        font-size: 0;
      }
      .el-range-editor,
      .el-select,
      .el-select__tags,
      .el-autocomplete,
      .el-input {
        width: 100%;
        padding: 0;
      }
      .el-range-editor.el-input__inner {
        padding: 3px 10px;
      }
    }
    .caret-wrapper {
      vertical-align: top;
    }
  }
  @keyframes bounce-in {
    0% {
      transform: scale(0);
    }
    50% {
      transform: scale(1.5);
    }
    100% {
      transform: scale(1);
    }
  }
}
</style>
