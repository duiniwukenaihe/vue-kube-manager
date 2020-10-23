<template>
  <div class="app-container">
    <div class="filter-container">
      <el-input v-model="listQuery.name" placeholder="应用名称" style="width: 200px;" class="filter-item" @keyup.enter.native="handleFilter" />
      <el-select v-model="listQuery.gpuLimits" placeholder="资源类型" clearable style="width: 130px" class="filter-item">
        <el-option v-for="item in resourceTypeOptions" :key="item" :label="item" :value="item" />
      </el-select>
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
      <el-checkbox v-model="showDeploymentStatus" class="filter-item" style="margin-left:15px;" @change="tableKey=tableKey+1">
        部署状态
      </el-checkbox>
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
          <a :href="'//node59/' + row.uid + '/'" target="_blank">{{ row.name }}</a>
          <el-tag :type="row.resourceType | typeStyleFilter">
            {{ row.resourceType }}
          </el-tag>
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
      <el-table-column label="CPU" width="80px" align="center">
        <template slot-scope="{row}">
          <span>{{ row.cpuRequests | cpuRequestsFilter }}</span>
        </template>
      </el-table-column>
      <el-table-column label="内存" width="80px" align="center">
        <template slot-scope="{row}">
          <span>{{ row.memRequests | memRequestsFilter }}</span>
        </template>
      </el-table-column>
      <el-table-column label="GPU" width="80px" align="center">
        <template slot-scope="{row}">
          <span>{{ row.gpuLimits }}</span>
        </template>
      </el-table-column>
      <el-table-column label="镜像" align="center" width="150">
        <template slot-scope="{row}">
          <span v-if="row.image" class="link-type" @click="handleFetchPv(row.image)">{{ row.image }}</span>
          <span v-else>0</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="80" align="center">
        <template slot-scope="{row}">
          <el-tag :type="row.status | statusStyleFilter">
            {{ row.status | statusFilter }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column v-if="showDeploymentStatus" label="可用" class-name="status-col" width="80">
        <template slot-scope="{row}">
          <el-tag :type="row.availableStatus | statusStyleFilter">
            {{ row.availableStatus | deploymentStatusFilter }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column v-if="showDeploymentStatus" label="执行" width="80" align="center">
        <template slot-scope="{row}">
          <el-tag :type="row.progressingStatus | statusStyleFilter">
            {{ row.progressingStatus | deploymentStatusFilter }}
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
      <el-form ref="dataForm" :rules="rules" :model="temp" label-position="left" label-width="80px" style="width: 400px; margin-left:50px;">
        <el-form-item label="名称" prop="name">
          <el-input v-model="temp.name" />
        </el-form-item>
        <el-form-item label="命名空间" prop="namespace">
          <el-input v-model="temp.namespace" />
        </el-form-item>
        <el-form-item label="镜像" prop="image">
          <el-select v-model="temp.image" class="filter-item" placeholder="请选择镜像">
            <el-option v-for="item in imageOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="CPU" prop="cpuRequests">
          <el-input v-model="temp.cpuRequests" />
        </el-form-item>
        <el-form-item label="内存 (Mi)" prop="memRequests">
          <el-input v-model="temp.memRequests" />
        </el-form-item>
        <el-form-item label="显卡" prop="gpuLimits">
          <el-input v-model="temp.gpuLimits" />
        </el-form-item>
        <el-form-item label="副本">
          <el-select v-model="temp.replicas" class="filter-item" placeholder="请选择副本数量">
            <el-option v-for="item in replicasOptions" :key="item" :label="item" :value="item" />
          </el-select>
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
  directives: { waves },
  filters: {
    cpuRequestsFilter(requests) {
      if (requests.substr(requests.length - 1, 1) === 'm') {
        return requests.replace('m', '') / 1000
      }
      return requests
    },
    memRequestsFilter(requests) {
      if (!isNaN(requests)) {
        return requests
      } else if (requests.substr(requests.length - 1, 1) === 'i') {
        return requests.replace('i', '')
      }
      return requests
    },
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
    },
    typeStyleFilter(type) {
      const typeMap = {
        CPU: 'primary',
        GPU: 'success'
      }
      return typeMap[type]
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
      resourceTypeOptions: ['CPU', 'GPU'],
      imageOptions: [
        'centos:latest',
        'ubuntu:18.04',
        'nginx:alpine',
        'httpd',
        'tomcat',
        'dorowu/ubuntu-desktop-lxde-vnc',
        'tsl0922/ttyd',
        'tydd2',
        'jupyter/tensorflow-notebook',
        'tensorflow/tensorflow:2.0.3-gpu-jupyter'
      ],
      replicasOptions: [1, 2, 3],
      sortOptions: [{ label: '时间升序', key: '+creationTimestamp' }, { label: '时间降序', key: '-creationTimestamp' }],
      showDeploymentStatus: false,
      temp: {
        name: '',
        namespace: 'ns100006',
        image: 'centos:latest',
        cpuRequests: '0.5',
        memRequests: '200',
        gpuLimits: '0',
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
    handleModifyStatus(row, status) {
      this.$message({
        message: '操作Success',
        type: 'success'
      })
      row.status = status
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
        namespace: 'ns100006',
        image: 'centos:latest',
        cpuRequests: 0.5,
        memRequests: 200,
        gpuLimits: 0,
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
          const requestBody = this.formatRequest(this.temp)
          createDeployment(requestBody).then(() => {
            // unshiftNew尚未完善，后续完善过再使用
            // this.unshiftNew(requestBody)
            this.getList()
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
      this.temp = Object.assign({}, row) // copy obj
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
          if (!tempData.memRequests.endsWith('i')) {
            tempData.memRequests = tempData.memRequests + 'Mi'
          }
          updateDeployment(tempData).then(() => {
            // const index = this.list.findIndex(v => v.uid === this.temp.uid)
            // this.list.splice(index, 1, this.temp)
            this.getList()
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
    formatRequest(temp) {
      const body = JSON.parse(JSON.stringify(this.temp))
      body.cpuRequests = body.cpuRequests ? body.cpuRequests * 1000 + 'm' : '500m'
      body.memRequests = body.memRequests ? body.memRequests + 'Mi' : '200Mi'
      body.gpuLimits = body.gpuLimits ? body.gpuLimits : 0
      body.replicas = body.replicas ? body.replicas : 1
      body.cpuLimits = body.cpuRequests
      body.memLimits = body.memRequests

      return body
    },
    unshiftNew(body) {
      body.availableReplicas = 0
      body.status = 'Starting'
      body.availableStatus = 'False'
      body.progressingStatus = 'False'
      body.resourceType = body.gpuLimits > 0 ? 'GPU' : 'CPU'
      this.list.unshift(body)
    }
  }
}
</script>
