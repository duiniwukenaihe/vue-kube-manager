<template>
  <div class="app-container">
    <div class="filter-container">
      <el-input v-if="checkPermission(['SYS_ADMIN'])" v-model="listQuery.organizationName" placeholder="组织" style="width: 200px;" class="filter-item" @keyup.enter.native="handleFilter" />
      <el-input v-model="listQuery.name" placeholder="用户名" style="width: 200px;" class="filter-item" @keyup.enter.native="handleFilter" />
      <el-select v-model="listQuery.enabled" placeholder="状态" clearable class="filter-item" style="width: 130px">
        <el-option v-for="item in statusOptions" :key="item.key" :label="item.display_name" :value="item.key" />
      </el-select>
      <el-select v-model="listQuery.sort" style="width: 140px" class="filter-item" @change="handleFilter">
        <el-option v-for="item in sortOptions" :key="item.key" :label="item.label" :value="item.key" />
      </el-select>
      <el-button v-waves class="filter-item" type="primary" icon="el-icon-search" @click="handleFilter">
        查询
      </el-button>
      <el-button class="filter-item" style="margin-left: 10px;" type="primary" icon="el-icon-edit" @click="handleCreate">
        新建
      </el-button>
    </div>
    <el-table
      :key="tableKey"
      v-loading="listLoading"
      :data="list"
      border
      fit
      highlight-current-row
      style="width: 100%;"
      @sort-change="sortChange"
    >
      <el-table-column v-if="checkPermission(['SYS_ADMIN'])" prop="organizationName" label="组织" width="160px" />
      <el-table-column prop="displayName" label="名字" min-width="120px" />
      <el-table-column prop="description" label="描述" min-width="200px" />
      <el-table-column prop="cpuLimits" label="CPU" min-width="80px" align="center" :formatter="cpuFormatter" />
      <el-table-column prop="memLimits" label="内存" min-width="80px" align="center" :formatter="memFormatter" />
      <el-table-column prop="gpuCountLimits" label="GPU" min-width="80px" align="center" :formatter="gpuCountFormatter" />
      <el-table-column prop="gpuMemLimits" label="显存" min-width="80px" align="center" :formatter="gpuMemFormatter" />
      <el-table-column prop="createTime" label="创建时间" min-width="150px" align="center" />
      <el-table-column label="操作" align="center" width="150" class-name="small-padding fixed-width">
        <template slot-scope="{row}">
          <el-button type="primary" size="mini" @click="handleUpdate(row)">
            编辑
          </el-button>
          <el-button type="danger" size="mini" @click="handleDelete(row)">
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <pagination v-show="total>0" :total="total" :page.sync="listQuery.page" :limit.sync="listQuery.limit" @pagination="getList" />

    <el-dialog :title="textMap[dialogStatus]" :visible.sync="dialogFormVisible">
      <el-form ref="dataForm" :rules="rules" :model="temp" label-position="left" label-width="100px" style="width: 400px; margin-left:50px;">
        <el-form-item label="实验名称" prop="displayName">
          <el-input v-model="temp.displayName" />
        </el-form-item>
        <el-form-item label="CPU核心数" prop="cpuLimits">
          <el-input-number v-model="temp.cpuLimits" :formatter="cpuFormatter" :min="0" :max="64" :precision="3" :step="0.1" />
        </el-form-item>
        <el-form-item label="内存 (M)" prop="memLimits">
          <el-input-number v-model="temp.memLimits" :min="100" :max="64000" :step="100" />
        </el-form-item>
        <el-form-item label="GPU数量" prop="gpuCountLimits">
          <el-input-number v-model="temp.gpuCountLimits" :min="0" :max="10" />
        </el-form-item>
        <el-form-item label="显存（G）" prop="gpuMemLimits">
          <el-input-number v-model="temp.gpuMemLimits" :min="0" :max="40" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogFormVisible = false">
          取消
        </el-button>
        <el-button type="primary" @click="dialogStatus==='create'?createData():updateData()">
          确认
        </el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import waves from '@/directive/waves' // waves directive
import Pagination from '@/components/Pagination' // secondary package based on el-pagination
import { listTemplate, createTemplate, updateTemplate, deleteTemplate } from '@/api/experiment'
import permission from '@/directive/permission/index.js'
import { checkPermission } from '@/utils/auth.js'

const statusOptions = [
  { key: 'true', display_name: '有效' },
  { key: 'false', display_name: '失效' }
]

const statusTypeKeyValue = statusOptions.reduce((acc, cur) => {
  acc[cur.key] = cur.display_name
  return acc
}, {})

export default {
  name: 'ComplexTable',
  components: { Pagination },
  directives: { waves, permission },
  filters: {
    statusFilter(status) {
      return statusTypeKeyValue[status]
    },
    statusStyleFilter(status) {
      const statusMap = {
        true: 'success',
        false: 'info'
      }
      return statusMap[status]
    }
  },
  data() {
    return {
      tableKey: 0,
      list: null,
      total: 0,
      listLoading: true,
      listQuery: {
        page: 1,
        limit: 20,
        organizationName: undefined,
        applyUserNickname: undefined,
        sort: '-createTime'
      },
      statusOptions,
      sortOptions: [{ label: '时间升序', key: '+createTime' }, { label: '时间降序', key: '-createTime' }],
      temp: {
        id: '',
        name: '',
        cpuLimits: 0.5,
        memLimits: 500,
        gpuCountLimits: 0,
        gpuMemLimits: 0
      },
      dialogFormVisible: false,
      dialogStatus: '',
      textMap: {
        update: '编辑',
        create: '新建'
      },
      rules: {

      },
      downloadLoading: false
    }
  },
  created() {
    this.getList()
  },
  methods: {
    checkPermission,
    getList() {
      this.listLoading = true
      listTemplate(this.listQuery).then(response => {
        this.list = response.result
        this.total = response.total

        // Just to simulate the time of the request
        setTimeout(() => {
          this.listLoading = false
        }, 0.5 * 1000)
      })
    },
    handleFilter() {
      this.listQuery.page = 1
      this.getList()
    },
    sortChange(data) {
      const { prop, order } = data
      if (prop === 'id') {
        this.sortByID(order)
      }
    },
    sortByID(order) {
      if (order === 'ascending') {
        this.listQuery.sort = '+id'
      } else {
        this.listQuery.sort = '-id'
      }
      this.handleFilter()
    },
    handleCreate() {
      this.resetTemp()
      this.dialogStatus = 'create'
      this.dialogFormVisible = true
      this.$nextTick(() => {
        this.$refs['dataForm'].clearValidate()
      })
    },
    createData() {
      this.$refs['dataForm'].validate((valid) => {
        if (valid) {
          const requestBody = Object.assign({}, this.temp)
          requestBody.cpuLimits *= 1000
          requestBody.cpuRequests = requestBody.cpuLimits
          requestBody.memRequests = requestBody.memLimits
          createTemplate(requestBody).then(() => {
            this.unshiftNew(this.formatBody(requestBody))
            this.dialogFormVisible = false
            this.$notify({
              title: '成功',
              message: '创建成功',
              type: 'success',
              duration: 2000
            })
          })
        }
      })
    },
    handleUpdate(row) {
      this.temp = Object.assign({}, row) // copy and format obj
      this.temp.cpuLimits = (this.temp.cpuLimits / 1000).toFixed(3)
      this.dialogStatus = 'update'
      this.dialogFormVisible = true
      this.$nextTick(() => {
        this.$refs['dataForm'].clearValidate()
      })
    },
    updateData() {
      this.$refs['dataForm'].validate((valid) => {
        if (valid) {
          const tempData = Object.assign({}, this.temp)
          tempData.cpuLimits *= 1000
          updateTemplate(tempData).then(() => {
            const index = this.list.findIndex(v => v.id === tempData.id)
            this.list.splice(index, 1, tempData)
            this.dialogFormVisible = false
            this.$notify({
              title: '成功',
              message: '更新成功',
              type: 'success',
              duration: 2000
            })
          })
        }
      })
    },
    handleDelete(row) {
      deleteTemplate(row.id).then(() => {
        row.enabled = true
        this.$notify({
          title: '成功',
          message: '模板已删除',
          type: 'success',
          duration: 2000
        })
      })
    },
    cpuFormatter(row, column) {
      return (row.cpuLimits / 1000) + '核'
    },
    memFormatter(row, column) {
      const requests = row.memLimits
      return requests + 'M'
    },
    gpuCountFormatter(row, column) {
      const requests = row.gpuCountLimits
      if (requests > 0) {
        return requests + '块'
      }
      return '-'
    },
    gpuMemFormatter(row, column) {
      const requests = row.gpuMemLimits
      if (requests > 0) {
        return requests + 'G'
      }
      return '-'
    }
  }
}
</script>
