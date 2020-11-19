<template>
  <el-popover
    popper-class="show-field"
    :placement="placement"
    :width="width"
    :trigger="trigger"
  >
    <p class="f-g-t">
      <el-checkbox v-model="checkAll" :indeterminate="isIndeterminate" @change="handleCheckAllChange">全部</el-checkbox>
    </p>
    <el-row v-for="(item, index) in config" :key="index" class="m-l">
      <p v-if="item.title">
        <el-checkbox
          v-model="item.checkAll"
          :indeterminate="item.isIndeterminate"
          @change="
            val => {
              handleCheckSubAllChange(val, item)
            }
          "
        >{{ item.title }}</el-checkbox>
      </p>
      <el-checkbox-group
        v-model="showPropsProxy"
        class="m-l"
        @change="
          val => {
            handleCheckedFieldChange(val, item)
          }
        "
      >
        <el-col
          v-for="item2 in fields.filter(x => item.colProps.includes(x.prop))"
          :key="item2.prop"
          :span="8"
        >
          <el-checkbox :label="item2.prop">
            {{ item2.label }}
          </el-checkbox>
        </el-col>
      </el-checkbox-group>
    </el-row>
    <el-button slot="reference" class="filter-item" style="margin-left: 10px;" type="default" icon="el-icon-circle-plus-outline">
      选择显示的字段
    </el-button>
  </el-popover>
</template>

<script>
export default {
  name: 'ShowField',
  components: {},
  props: {
    fields: { type: Array, required: true },
    placement: { type: String, default: 'top' },
    width: { type: String, default: '540px' },
    trigger: { type: String, default: 'click' },
    config: { type: Array, default() { return [] } },
    value: { type: Array, default() { return [] } }
  },
  data() {
    return {
      checkAll: true,
      isIndeterminate: false
    }
  },
  computed: {
    showPropsProxy: {
      get() {
        return this.value
      },
      set(val) {
        this.$emit('input', val)
      }
    }
  },
  watch: {},
  created() {},
  mounted() {
    this.config.forEach(f => {
      f.checkAll = !f.colProps.some(x => !this.value.includes(x))
      f.isIndeterminate = false
    })
    this.isIndeterminate = false
  },

  methods: {
    handleCheckAllChange(val) {
      this.showPropsProxy = val ? this.fields.map(x => x.prop) : []
      this.config.forEach(f => {
        f.checkAll = val
        f.isIndeterminate = false
      })
      this.isIndeterminate = false
    },
    handleCheckSubAllChange(val, item) {
      if (val) {
        item.colProps.forEach(x => {
          if (!this.showPropsProxy.includes(x)) {
            this.showPropsProxy.push(x)
          }
        })
      } else {
        this.showPropsProxy = this.showPropsProxy.filter(
          x => !item.colProps.includes(x)
        )
      }
      item.isIndeterminate = false
    },
    handleCheckedFieldChange(value, item) {
      const checkedCount = value.filter(x => item.colProps.includes(x)).length
      item.checkAll = checkedCount === item.colProps.length
      item.isIndeterminate =
        checkedCount > 0 && checkedCount < item.colProps.length
      this.syncCheckStatus()
    },
    syncCheckStatus() {
      this.checkAll = !this.config.some(x => !x.checkAll)
      this.isIndeterminate = this.config.some(x => x.isIndeterminate)
    }
  }
}
</script>

<style lang="scss">
</style>
