<template>
  <div class="app-container">
    <div class="filter-container">
      <el-input v-if="checkPermission(['SYS_ADMIN'])" v-model="listQuery.organizationName" placeholder="组织" style="width: 200px;" class="filter-item" @keyup.enter.native="handleFilter" />
      <el-input v-model="listQuery.displayName" placeholder="名称" style="width: 200px;" class="filter-item" @keyup.enter.native="handleFilter" />
      <el-input v-model="listQuery.description" placeholder="描述" style="width: 200px;" class="filter-item" />
      <el-button v-waves class="filter-item" type="primary" icon="el-icon-search" @click="handleFilter">
        查询
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
      <el-table-column label="名称" min-width="120px">
        <template slot-scope="{row}">
          <span>{{ row.displayName }}</span>
          <a v-if="row.status=='Running'" :href="'//kube-manager.ingress/' + row.ttydMd5 + '/'" target="_blank" class="link-type"> 终端</a>
          <a v-if="row.status=='Running' && row.webMd5" :href="'//kube-manager.ingress/' + row.webMd5 + '/'" target="_blank" class="link-type"> 网页</a>
        </template>
      </el-table-column>
      <el-table-column prop="description" label="描述" min-width="200px" />
      <el-table-column prop="startTime" label="启动时间" min-width="150px" align="center" />
      <el-table-column label="状态" width="80" align="center">
        <template slot-scope="{row}">
          <el-tag :type="row.status | statusStyleFilter">
            {{ row.status | statusFilter }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="80" class-name="small-padding fixed-width">
        <template slot-scope="{row}">
          <el-button v-if="row.status=='Free'" type="primary" size="mini" @click="handleStart(row)">
            启动
          </el-button>
          <!-- <el-button v-if="row.status!='Free'" type="warning" size="mini" @click="handleRestart(row)">
            重启
          </el-button> -->
          <el-button v-if="row.status!='Free'" type="danger" size="mini" @click="handleShutdown(row)">
            停止
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <pagination v-show="total>0" :total="total" :page.sync="listQuery.page" :limit.sync="listQuery.limit" @pagination="getList" />
  </div>
</template>

<script>
import waves from '@/directive/waves' // waves directive
import Pagination from '@/components/Pagination' // secondary package based on el-pagination
import { listTask, startInstance, restartInstance, shutdownInstance } from '@/api/experiment'
import permission from '@/directive/permission/index.js'
import { checkPermission } from '@/utils/auth.js'

const statusOptions = [
  { key: 'Running', display_name: '运行中' },
  { key: 'Starting', display_name: '启动中' },
  { key: 'Pending', display_name: '阻塞' },
  { key: 'Error', display_name: '失败' },
  { key: 'Free', display_name: '未运行' }
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
        'Running': 'success',
        'Starting': 'primary',
        'Pending': 'warning',
        'Error': 'danger',
        'Free': 'info'
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
      listTask(this.listQuery).then(response => {
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
    handleLaunch(row) {
      window.open(row.path)
    },
    handleStart(row) {
      startInstance(row.id).then(() => {
        row.enabled = true
        this.$notify({
          title: '成功',
          message: '正在启动应用，请稍候',
          type: 'success',
          duration: 2000
        })
      })
    },
    handleRestart(row) {
      restartInstance(row.id).then(() => {
        row.enabled = true
        this.$notify({
          title: '成功',
          message: '正在重新启动，请稍候',
          type: 'success',
          duration: 2000
        })
      })
    },
    handleShutdown(row) {
      shutdownInstance(row.id).then(() => {
        row.enabled = true
        this.$notify({
          title: '成功',
          message: '正在停止应用，请稍候',
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
