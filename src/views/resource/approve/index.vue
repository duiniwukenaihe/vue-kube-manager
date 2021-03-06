<template>
  <div class="app-container">
    <div class="filter-container">
      <el-input v-model="listQuery.organizationName" placeholder="组织" style="width: 200px;" class="filter-item" @keyup.enter.native="handleFilter" />
      <el-input v-model="listQuery.applyUserNickname" placeholder="申请人" style="width: 200px;" class="filter-item" @keyup.enter.native="handleFilter" />
      <el-select v-model="listQuery.status" placeholder="状态" clearable class="filter-item" style="width: 130px">
        <el-option v-for="item in statusOptions" :key="item.key" :label="item.display_name" :value="item.key" />
      </el-select>
      <el-select v-model="listQuery.sort" style="width: 140px" class="filter-item" @change="handleFilter">
        <el-option v-for="item in sortOptions" :key="item.key" :label="item.label" :value="item.key" />
      </el-select>
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
      <el-table-column prop="organizationName" label="组织" width="160px" />
      <el-table-column prop="applyUserNickname" label="申请人" width="120px" align="center" />
      <el-table-column prop="cpuLimits" label="CPU" width="80px" align="center" :formatter="cpuFormatter" />
      <el-table-column prop="memLimits" label="内存" width="80px" align="center" :formatter="memFormatter" />
      <el-table-column prop="gpuCountLimits" label="GPU" width="80px" align="center" :formatter="gpuCountFormatter" />
      <el-table-column prop="gpuMemLimits" label="显存" width="80px" align="center" :formatter="gpuMemFormatter" />
      <el-table-column prop="remark" label="原因" />
      <el-table-column label="状态" width="80" align="center">
        <template slot-scope="{row}">
          <el-tag :type="row.status | statusStyleFilter">
            {{ row.status | statusFilter }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="150" class-name="small-padding fixed-width">
        <template slot-scope="{row}">
          <el-button v-if="row.status=='SUBMITTED'" type="primary" size="mini" @click="handleAgree(row)">
            同意
          </el-button>
          <el-button v-if="row.status=='SUBMITTED'" type="danger" size="mini" @click="handleRefuse(row)">
            拒绝
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
import { listReceive, handleApplication } from '@/api/resource-application'

const statusOptions = [
  { key: 'SUBMITTED', display_name: '待审批' },
  { key: 'REFUSED', display_name: '已拒绝' },
  { key: 'APPROVED', display_name: '已同意' }
]

const statusTypeKeyValue = statusOptions.reduce((acc, cur) => {
  acc[cur.key] = cur.display_name
  return acc
}, {})

export default {
  name: 'ComplexTable',
  components: { Pagination },
  directives: { waves },
  filters: {
    statusFilter(status) {
      return statusTypeKeyValue[status]
    },
    statusStyleFilter(status) {
      const statusMap = {
        SUBMITTED: 'primary',
        REFUSED: 'info',
        APPROVED: 'success'
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
      },
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
    getList() {
      this.listLoading = true
      listReceive(this.listQuery).then(response => {
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
    handleAgree(row) {
      handleApplication(row.id, 'AGREE', '备注').then(() => {
        row.status = 'APPROVED'
        this.$notify({
          title: '成功',
          message: '审批通过',
          type: 'success',
          duration: 2000
        })
      })
    },
    handleRefuse(row) {
      handleApplication(row.id, 'REFUSE', '备注').then(() => {
        row.status = 'REFUSED'
        this.$notify({
          title: '成功',
          message: '审批拒绝',
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
