<template>
  <div class="app-container">
    <div class="filter-container">
      <el-input v-model="listQuery.name" placeholder="名称" style="width: 200px;" class="filter-item" @keyup.enter.native="handleFilter" />
      <el-select v-if="false" v-model="listQuery.sort" style="width: 140px" class="filter-item" @change="handleFilter">
        <el-option v-for="item in sortOptions" :key="item.key" :label="item.label" :value="item.key" />
      </el-select>
      <el-button v-waves class="filter-item" type="primary" icon="el-icon-search" @click="handleFilter">
        查询
      </el-button>
      <el-button class="filter-item" style="margin-left: 10px;" type="primary" icon="el-icon-upload" @click="handleCreate">
        添加
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
      <el-table-column prop="repoTag" label="全称" min-width="200px" />
      <el-table-column prop="repository" label="仓库" min-width="120px" />
      <el-table-column prop="tag" label="标签" min-width="120px" />
      <el-table-column prop="enableWebSsh" label="WebSSH">
        <template slot-scope="{row}">
          <el-tag v-if="row.enableWebSsh" type="success">启用</el-tag>
          <el-tag v-if="!row.enableWebSsh" type="info">禁用</el-tag>
        </template>
      </el-table-column>/>
      <el-table-column prop="webPort" label="Web应用端口" :formatter="emptyFormatter" />
      <el-table-column prop="size" label="大小" :formatter="emptyFormatter" />
      <el-table-column label="操作" align="center" width="150" class-name="small-padding fixed-width">
        <template slot-scope="{row}">
          <el-button type="primary" size="mini" @click="handleCopy(row)">
            复制
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
        <el-form-item label="名称" prop="repoTag">
          <el-input v-model="temp.repoTag" @input="e => temp.repoTag = repoTagVaildate(e)" />
        </el-form-item>
        <el-form-item label="文件" prop="file">
          <el-input v-model="temp.file" />
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
import { listImage, uploadImage, deleteImage } from '@/api/image'
import permission from '@/directive/permission/index.js'
import { checkPermission } from '@/utils/auth.js'

export default {
  name: 'ComplexTable',
  components: { Pagination },
  directives: { waves, permission },
  filters: {
  },
  data() {
    return {
      tableKey: 0,
      list: null,
      total: 0,
      listLoading: true,
      listQuery: {
        page: 1,
        limit: 10,
        organizationName: undefined,
        applyUserNickname: undefined,
        sort: '-createTime'
      },
      sortOptions: [{ label: '时间升序', key: '+createTime' }, { label: '时间降序', key: '-createTime' }],
      temp: {
        id: '',
        repoTag: ''
      },
      dialogFormVisible: false,
      dialogStatus: '',
      textMap: {
        upload: '上传',
        build: '构建'
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
      listImage(this.listQuery).then(response => {
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
        cpuLimits: 1,
        memLimits: 2048,
        gpuCountLimits: 1,
        gpuMemLimits: 8,
        password: 'password1'
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
          uploadImage(requestBody).then(() => {
            requestBody.enabled = true
            this.list.unshift(requestBody)
            this.dialogFormVisible = false
            this.$notify({
              title: '成功',
              message: '添加成功',
              type: 'success',
              duration: 2000
            })
          })
        }
      })
    },
    handleDelete(row) {
      deleteImage(row.id).then(() => {
        row.enabled = false
        this.$notify({
          title: '成功',
          message: '镜像已删除',
          type: 'success',
          duration: 2000
        })
      })
    },
    repoTagVaildate(value) {
      value = value.replace(/[\u4e00-\u9fa5\s+]|[`~!@#$%^&*()_\+=<>?"{}|,.;'\\[\]·~！￥……（）——《》？：“”【】、；‘’，。、]/g, '')
        .replace(/\s/g, '')
      return value
    },
    emptyFormatter(row, column) {
      return row[column.property] || '-'
    }
  }
}
</script>
