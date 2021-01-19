<template>
  <div class="app-container">
    <el-form ref="form" :model="apply" label-position="left" label-width="120px" style="padding: 30px;">
      <el-form-item label="CPU核心数">
        <el-input-number v-model="apply.cpuLimits" :min="0" :max="64" :precision="3" :step="0.1" placeholder="请输入" :formatter="cpuFormatter" />
        <el-tag :type="apply.cpuLimits | diffStyleFilter(current.cpuLimits)">
          {{ apply.cpuLimits | diffDecimalTextFilter(current.cpuLimits) }}
        </el-tag>
      </el-form-item>
      <el-form-item label="内存（M）">
        <el-input-number v-model="apply.memLimits" :min="0" :max="64000" />
        <el-tag :type="apply.memLimits | diffStyleFilter(current.memLimits)">
          {{ apply.memLimits | diffTextFilter(current.memLimits) }}
        </el-tag>
      </el-form-item>
      <el-form-item label="GPU数量">
        <el-input-number v-model="apply.gpuCountLimits" :min="0" :max="8" :precision="2" :step="0.1" />
        <el-tag :type="apply.gpuCountLimits | diffStyleFilter(current.gpuCountLimits)">
          {{ apply.gpuCountLimits | diffTextFilter(current.gpuCountLimits) }}
        </el-tag>
      </el-form-item>
      <el-form-item label="显存（G）">
        <el-input-number v-model="apply.gpuMemLimits" :min="0" :max="320" :step="0.25" />
        <el-tag :type="apply.gpuMemLimits | diffStyleFilter(current.gpuMemLimits)">
          {{ apply.gpuMemLimits | diffTextFilter(current.gpuMemLimits) }}
        </el-tag>
      </el-form-item>
      <el-form-item>
        <el-button v-if="!apply.id" type="primary" @click="onSubmit">申请</el-button>
        <el-button v-if="apply.id" type="danger" @click="onCancel">撤销</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
import { Message } from 'element-ui'
import { getInfo } from '@/api/user'
import { getMySubmitted, sumbitApplication, cancelApplication } from '@/api/resource-application'

export default {
  filters: {
    diffStyleFilter(apply, current) {
      if (apply > current) {
        return 'success'
      } else if (apply < current) {
        return 'danger'
      } else {
        return 'info'
      }
    },
    diffTextFilter(apply, current) {
      if (!apply || !current || apply === current) {
        return '+ 0'
      }
      let diff = apply - current
      let prefix = '+ '
      if (diff < 0) {
        prefix = '- '
        diff = -diff
      }
      return prefix + diff
    },
    diffDecimalTextFilter(apply, current) {
      if (!apply || !current || apply === current) {
        return '+ 0.000'
      }
      let diff = apply - current
      let prefix = '+ '
      if (diff < 0) {
        prefix = '- '
        diff = -diff
      }
      return prefix + diff.toFixed(3)
    }
  },
  data() {
    return {
      current: {
        cpuLimits: 1.000,
        memLimits: 1024,
        gpuCountLimits: 1,
        gpuMemLimits: 1
      },
      apply: {
        id: '',
        cpuLimits: 1.000,
        memLimits: 1024,
        gpuCountLimits: 1,
        gpuMemLimits: 1
      }
    }
  },
  mounted() {
    this.getCurrent()
    this.getSubmmited()
  },
  methods: {
    getCurrent() {
      getInfo().then(response => {
        const data = response.result
        this.current = data
        data.cpuLimits /= 1000
        data.gpuCountLimits /= 100
        data.gpuMemLimits /= 4

        this.apply.cpuLimits = data.cpuLimits
        this.apply.memLimits = data.memLimits
        this.apply.gpuCountLimits = data.gpuCountLimits
        this.apply.gpuMemLimits = data.gpuMemLimits
      })
    },
    getSubmmited() {
      getMySubmitted().then(response => {
        if (response.total !== 0) {
          this.apply = response.result[0]
          this.apply.cpuLimits /= 1000
          this.apply.gpuCountLimits /= 100
          this.apply.gpuMemLimits /= 4
        }
      })
    },
    onSubmit() {
      this.$refs['form'].validate((valid) => {
        if (valid) {
          const requestBody = JSON.parse(JSON.stringify(this.apply))
          if (requestBody.cpuLimits === this.current.cpuLimits &&
              requestBody.memLimits === this.current.memLimits &&
              requestBody.gpuCountLimits === this.current.gpuCountLimits &&
              requestBody.gpuMemLimits === this.current.gpuMemLimits) {
            Message({
              message: '无效的申请',
              type: 'error',
              duration: 2 * 1000
            })
            return false
          }
          requestBody.cpuLimits *= 1000
          requestBody.gpuCountLimits *= 100
          requestBody.gpuMemLimits *= 4
          sumbitApplication(requestBody).then(response => {
            this.$notify({
              title: '成功',
              message: '申请成功',
              type: 'success',
              duration: 2000
            })
            this.apply.id = response.result.id
          })
        }
      })
    },
    onCancel() {
      if (!this.apply.id) {
        return false
      }
      cancelApplication(this.apply.id).then(() => {
        this.$notify({
          title: '成功',
          message: '撤销成功',
          type: 'success',
          duration: 2000
        })
        this.apply.id = ''
        this.apply.cpuLimits = this.current.cpuLimits
        this.apply.memLimits = this.current.memLimits
        this.apply.gpuCountLimits = this.current.gpuCountLimits
        this.apply.gpuMemLimits = this.current.gpuMemLimits
      })
    }
  }
}
</script>

<style scoped>
.el-tag {
  border: none;
  background: none;
  font-size: inherit;
}
</style>

