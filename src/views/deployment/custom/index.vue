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
          <span>{{ row.name }}</span>
          <el-tag v-if="row.resourceType=='GPU'" type="success">
            GPU
          </el-tag>
          <a v-if="row.status=='Running' && row.webSshMd5" :href="'//kube-manager.ingress/' + row.webSshMd5 + '/'" target="_blank" class="link-type"> 终端</a>
          <a v-if="row.status=='Running' && row.webAppMd5" :href="'//kube-manager.ingress/' + row.webAppMd5 + '/'" target="_blank" class="link-type"> 网页</a>
        </template>
      </el-table-column>
      <el-table-column v-if="checkPermission(['SYS_ADMIN'])" prop="namespace" label="命名空间" min-width="100px" align="center" />
      <el-table-column v-if="checkPermission(['ORG_ADMIN'])" prop="labels.created-by" label="创建人" min-width="100px" align="center" />
      <el-table-column prop="cpuLimits" label="CPU" min-width="80px" align="center" :formatter="cpuFormatter" />
      <el-table-column prop="memLimits" label="内存" min-width="80px" align="center" :formatter="memFormatter" />
      <el-table-column prop="gpuCountLimits" label="GPU" min-width="80px" align="center" :formatter="gpuCountFormatter" />
      <el-table-column prop="gpuMemLimits" label="显存" min-width="80px" align="center" :formatter="gpuMemFormatter" />
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
          <el-button v-if="row.status=='Free'" size="mini" type="success" @click="handleStart(row)">
            启动
          </el-button>
          <el-button v-if="row.status!='Free'" size="mini" type="success" @click="handleStop(row)">
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
        <el-form-item v-if="dialogStatus==='create'" label="名称" prop="name">
          <el-input v-model="temp.name" placeholder="例: centos8-02" @input="e => temp.name = nameVaildate(e)" />
        </el-form-item>
        <el-form-item v-permission="['SYS_ADMIN']" label="命名空间" prop="namespace">
          <el-input v-model="temp.namespace" />
        </el-form-item>
        <!-- <el-form-item label="镜像" prop="image">
          <el-select v-model="temp.image" class="filter-item" placeholder="请选择镜像">
            <el-option v-for="item in imageOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item> -->
        <el-form-item v-if="dialogStatus==='create'" label="镜像" prop="image">
          <el-input v-model="temp.image" placeholder="例: postgres:9.6.20-alpine" />
        </el-form-item>
        <el-form-item label="CPU核心数" prop="cpuLimits">
          <el-input-number v-model="temp.cpuLimits" :min="0" :max="64" :precision="3" :step="0.1" />
        </el-form-item>
        <el-form-item label="内存 (M)" prop="memLimits">
          <el-input-number v-model="temp.memLimits" :min="100" :max="64000" :step="100" />
        </el-form-item>
        <el-form-item label="GPU数量" prop="gpuCountLimits">
          <el-input-number v-model="temp.gpuCountLimits" :min="0" :max="10" :precision="2" :step="0.1" />
        </el-form-item>
        <el-form-item label="显存（G）" prop="gpuMemLimits">
          <el-input-number v-model="temp.gpuMemLimits" :min="0" :max="40" :step="0.25" />
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
  { key: 'Pending', display_name: '等待中' },
  { key: 'Error', display_name: '失败' },
  { key: 'Free', display_name: '已释放' }
]

// arr to obj, such as { CN : "China", US : "USA" }
const statusTypeKeyValue = statusOptions.reduce((acc, cur) => {
  acc[cur.key] = cur.display_name
  return acc
}, {})

export default {
  name: 'Deployment',
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
        Starting: 'primary',
        Pending: 'warning',
        Running: 'success',
        Error: 'danger',
        Free: 'info',
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
        'centos:7',
        'nvidia/cuda-dli:v1'
      ],
      replicasOptions: [1, 2, 3],
      sortOptions: [{ label: '时间升序', key: '+creationTimestamp' }, { label: '时间降序', key: '-creationTimestamp' }],
      temp: {
        uid: '',
        name: '',
        namespace: '',
        image: '',
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
        image: [{ required: true, message: '镜像不得为空', trigger: 'blur' }]
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
        namespace: '',
        image: '',
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
          const requestBody = this.formatRequest(this.temp)
          createDeployment(requestBody).then(() => {
            this.unshiftNew(requestBody)
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
      this.temp.gpuCountLimits = (this.temp.gpuCountLimits / 100).toFixed(2)
      this.temp.gpuMemLimits = (this.temp.gpuMemLimits / 4).toFixed(2)
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
          const requestBody = this.formatRequest(this.temp)
          updateDeployment(requestBody).then(() => {
            const index = this.list.findIndex(v => v.uid === this.temp.uid)
            requestBody.availableReplicas = 0
            requestBody.status = 'Pending'
            this.list.splice(index, 1, requestBody)
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
        row.availableReplicas = 0
        row.status = 'Free'
      })
    },
    handleFetchPv(pv) {
      fetchPv(pv).then(response => {
        this.pvData = response.data.pvData
        this.dialogPvVisible = true
      })
    },
    nameVaildate(value) {
      const arr = value.split('')
      let firstLetterIndex = arr.length
      for (let i = 0; i < arr.length; i++) {
        if (arr[i] >= 'a' && arr[i] <= 'z') {
          firstLetterIndex = i
          break
        }
      }
      value = value.substr(firstLetterIndex, arr.length)
      value = value.replace(/[\u4e00-\u9fa5/\s+/]|[`~!@#$%^&*()_+=<>?:"{}|,./;'\\[\]·！￥……（）——《》？：“”【】、；‘’，。、]/g, '')
        .replace(/\s/g, '')
      return value
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
    unshiftNew(body) {
      body.availableReplicas = 0
      body.status = 'Starting'
      if (body.gpuCountLimits > 0 || body.gpuMemLimits > 0) {
        body.resourceType = 'GPU'
      } else {
        body.resourceType = 'CPU'
      }
      this.list.unshift(body)
    },
    formatRequest(temp) {
      const requestBody = Object.assign({}, temp)
      requestBody.cpuLimits *= 1000
      // 资源request默认与limit相同
      requestBody.cpuRequests = requestBody.cpuLimits
      requestBody.memRequests = requestBody.memLimits
      // 显卡数量大于1时, 只能使用整数
      requestBody.gpuCountLimits = temp.gpuCountLimits > 1 ? Math.floor(temp.gpuCountLimits) : temp.gpuCountLimits
      requestBody.gpuCountLimits *= 100
      requestBody.gpuMemLimits = temp.gpuMemLimits * 4
      return requestBody
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
        return requests / 100 + '块'
      }
      return '-'
    },
    gpuMemFormatter(row, column) {
      const requests = row.gpuMemLimits
      if (requests > 0) {
        return requests / 4 + 'G'
      }
      return '-'
    }
  }
}
</script>
