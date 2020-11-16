<template>
  <div class="app-container">
    <div class="filter-container">
      <el-input v-model="listQuery.name" placeholder="应用名称" style="width: 200px;" class="filter-item" @keyup.enter.native="handleFilter" />
      <el-select v-model="listQuery.status" placeholder="状态" clearable class="filter-item" style="width: 130px">
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
      <el-table-column v-if="false" prop="id">
        <template slot-scope="{row}">
          <span>{{ row.uid }}</span>
        </template>
      </el-table-column>
      <el-table-column label="应用名称" min-width="150px">
        <template slot-scope="{row}">
          <a :href="'//node59/' + row.uid + '/'" target="_blank" class="link-type">{{ row.name }}</a>
          <el-tag v-if="row.resourceType=='GPU'" type="success">
            GPU
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column v-if="checkPermission(['SYS_ADMIN'])" label="命名空间" min-width="100px" align="center">
        <template slot-scope="{row}">
          <span>{{ row.namespace }}</span>
        </template>
      </el-table-column>
      <el-table-column label="CPU" min-width="80px" align="center">
        <template slot-scope="{row}">
          <span>{{ row.cpuLimits }}</span>
        </template>
      </el-table-column>
      <el-table-column label="内存" min-width="80px" align="center">
        <template slot-scope="{row}">
          <span>{{ row.memLimits }}</span>
        </template>
      </el-table-column>
      <el-table-column label="GPU" min-width="80px" align="center">
        <template slot-scope="{row}">
          <span>{{ row.gpuCountLimits }}</span>
        </template>
      </el-table-column>
      <el-table-column label="显存" min-width="80px" align="center">
        <template slot-scope="{row}">
          <span>{{ row.gpuMemLimits }}</span>
        </template>
      </el-table-column>
      <el-table-column label="镜像" min-width="220px">
        <template slot-scope="{row}">
          <span v-if="row.image" class="link-type" @click="handleFetchPv(row.image)">{{ row.image }}</span>
          <span v-else>0</span>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" width="150px" align="center">
        <template slot-scope="{row}">
          <span>{{ row.creationTimestamp | parseTime('{y}-{m}-{d} {h}:{i}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="副本" width="80px" align="center">
        <template slot-scope="{row}">
          <span>{{ row.availableReplicas }} / {{ row.replicas }}</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="80" align="center">
        <template slot-scope="{row}">
          <el-tag :type="row.status | statusStyleFilter">
            {{ row.status | statusFilter }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="230" class-name="small-padding fixed-width">
        <template slot-scope="{row,$index}">
          <el-button type="primary" size="mini" @click="handleUpdate(row)">
            编辑
          </el-button>
          <el-button v-if="row.status=='Released'" size="mini" type="success" @click="handleStart(row)">
            启动
          </el-button>
          <el-button v-if="row.status!='Released'" size="mini" type="success" @click="handleStop(row)">
            释放
          </el-button>
          <el-button v-if="row.status!='deleted'" size="mini" type="danger" @click="handleDelete(row,$index)">
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total>0" :total="total" :page.sync="listQuery.page" :limit.sync="listQuery.limit" @pagination="getList" />

    <el-dialog :title="textMap[dialogStatus]" :visible.sync="dialogFormVisible">
      <el-form ref="dataForm" :rules="rules" :model="temp" label-position="left" label-width="100px" style="width: 400px; margin-left:50px;">
        <el-form-item label="名称" prop="name">
          <el-input v-model="temp.name" />
        </el-form-item>
        <el-form-item v-permission="['SYS_ADMIN']" label="命名空间" prop="namespace">
          <el-input v-model="temp.namespace" />
        </el-form-item>
        <el-form-item label="镜像" prop="image">
          <el-select v-model="temp.image" class="filter-item" placeholder="请选择镜像">
            <el-option v-for="item in imageOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="CPU核心数" prop="cpuLimits">
          <el-input-number v-model="temp.cpuLimits" :min="0" :max="64" :precision="3" :step="0.1" />
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
        <el-form-item label="副本">
          <el-input-number v-model="temp.replicas" :min="1" :max="3" />
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

    <el-dialog :visible.sync="dialogPvVisible" title="镜像信息">
      <el-table :data="pvData" border fit highlight-current-row style="width: 100%">
        <el-table-column prop="key" label="待开发" />
        <el-table-column prop="pv" label="待开发" />
      </el-table>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="dialogPvVisible = false">确认</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { listDeployment, createDeployment, deleteDeployment, updateDeployment, scaleDeployment, fetchPv } from '@/api/deployment'
import waves from '@/directive/waves' // waves directive
import { parseTime } from '@/utils'
import Pagination from '@/components/Pagination' // secondary package based on el-pagination
// 当然你也可以为了方便使用，将它注册到全局
import permission from '@/directive/permission/index.js' // 权限判断指令
import { checkPermission } from '@/utils/auth.js'

const statusOptions = [
  { key: 'Running', display_name: '运行中' },
  { key: 'Starting', display_name: '启动中' },
  { key: 'Failed', display_name: '失败' },
  { key: 'Released', display_name: '已释放' }
]

// arr to obj, such as { CN : "China", US : "USA" }
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
    deploymentStatusFilter(status) {
      const deploymentStatusMap = {
        True: '是',
        False: '否',
        Unknown: '未知'
      }
      return deploymentStatusMap[status]
    },
    statusStyleFilter(status) {
      const statusMap = {
        True: 'success',
        False: 'danger',
        Starting: 'info',
        Running: 'success',
        Failed: 'danger',
        Released: 'info',
        Unknown: 'info'
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
        name: undefined,
        resourceType: undefined,
        status: undefined,
        sort: '-creationTimestamp'
      },
      statusOptions,
      imageOptions: [
        'tensorflow:2.0.3-gpu-jupyter',
        'jupyter-notebook:r-4.0.3',
        'terminal:1.6.1',
        'httpd:2.4.46',
        'ubuntu-desktop-lxde:focal',
        'centos:7'
      ],
      replicasOptions: [1, 2, 3],
      sortOptions: [{ label: '时间升序', key: '+creationTimestamp' }, { label: '时间降序', key: '-creationTimestamp' }],
      temp: {
        uid: '',
        name: '',
        namespace: 'ns100009',
        image: 'terminal:1.6.1',
        cpuLimits: 0.5,
        cpuRequests: 0.5,
        memLimits: 500,
        memRequests: 500,
        gpuCountLimits: 0,
        gpuMemLimits: 0,
        replicas: 1
      },
      dialogFormVisible: false,
      dialogStatus: '',
      textMap: {
        update: '编辑',
        create: '新建'
      },
      dialogPvVisible: false,
      pvData: [],
      rules: {
        name: [{ required: true, message: '名称不得为空', trigger: 'blur' }],
        namespace: [{ required: true, message: '命名空间不得为空', trigger: 'blur' }],
        image: [{ required: true, message: '镜像不得为空', trigger: 'change' }]
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
      listDeployment(this.listQuery).then(response => {
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
    resetTemp() {
      this.temp = {
        name: '',
        namespace: 'ns100009',
        image: 'terminal:1.6.1',
        cpuLimits: 0.5,
        memLimits: 500,
        gpuCountLimits: 0,
        gpuMemLimits: 0,
        replicas: 1
      }
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
          const requestBody = this.standardizeRow(this.temp)
          createDeployment(requestBody).then(() => {
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
      this.temp = this.standardizeRow(row) // copy and format obj
      this.temp.timestamp = new Date(this.temp.timestamp)
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
          tempData.cpuRequests = tempData.cpuLimits
          tempData.memRequests = tempData.memLimits
          updateDeployment(tempData).then(() => {
            const index = this.list.findIndex(v => v.uid === this.temp.uid)
            this.list.splice(index, 1, this.formatBody(this.temp))
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
    handleDelete(row, index) {
      deleteDeployment(row.namespace, row.name).then(() => {
        this.$notify({
          title: '成功',
          message: '正在删除，请稍候',
          type: 'success',
          duration: 2000
        })
        this.list.splice(index, 1)
      })
    },
    handleStart(row) {
      const tempData = Object.assign({}, row)
      tempData.replicas = 1
      scaleDeployment(tempData).then(() => {
        this.$notify({
          title: '成功',
          message: '正在启动应用，请稍候',
          type: 'success',
          duration: 2000
        })
        row.status = 'Starting'
      })
    },
    handleStop(row) {
      const tempData = Object.assign({}, row)
      tempData.replicas = 0
      scaleDeployment(tempData).then(() => {
        this.$notify({
          title: '成功',
          message: '正在停止应用，请稍候',
          type: 'success',
          duration: 2000
        })
        row.status = 'Released'
      })
    },
    handleFetchPv(pv) {
      fetchPv(pv).then(response => {
        this.pvData = response.data.pvData
        this.dialogPvVisible = true
      })
    },
    formatJson(filterVal) {
      return this.list.map(v => filterVal.map(j => {
        if (j === 'timestamp') {
          return parseTime(v[j])
        } else {
          return v[j]
        }
      }))
    },
    standardizeRow(row) {
      console.log('uid: ' + row.uid)
      const body = Object.assign({}, row)
      body.cpuRequests = body.cpuLimits
      body.memLimits = parseInt(body.memLimits)
      body.memRequests = body.memLimits
      body.gpuCountLimits = body.gpuCountLimits === '-' ? 0 : body.gpuCountLimits
      body.gpuMemLimits = body.gpuMemLimits === '-' ? 0 : parseInt(body.gpuMemLimits)
      console.log(body)
      return body
    },
    formatBody(body) {
      const row = Object.assign({}, body)
      row.status = 'Starting'
      row.memLimits = row.memLimits + 'M'
      row.gpuCountLimits = row.gpuCountLimits > 0 ? row.gpuCountLimits : '-'
      row.gpuMemLimits = row.gpuMemLimits > 0 ? row.gpuMemLimits + 'G' : '-'
      return row
    },
    unshiftNew(body) {
      body.availableReplicas = 0
      body.status = 'Starting'
      if (body.gpuCountLimits > 0 || body.gpuMemLimits > 0) {
        body.resourceType = 'GPU'
      } else {
        body.resourceType = 'CPU'
      }
      this.list.unshift(body)
    }
  }
}
</script>
