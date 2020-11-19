<template>
  <el-select v-model="currentValue" placeholder="请选择" multiple collapse-tags @change="handleChange">
    <el-option
      v-for="item in currentoptions"
      :key="item.value"
      :label="item.label"
      :value="item.value"
    />
  </el-select>
</template>
<script>
export default {
  name: 'MoneOptions',
  props: {
    value: {
      type: Array,
      required: true,
      default() {
        return []
      }
    },
    options: {
      type: Array,
      default() {
        return []
      }
    }
  },
  data() {
    return {
      currentValue: this.value,
      currentoptions: this.options
    }
  },
  computed: {
    valueProxy: {
      get() {
        return this.value
      },
      set(val) {
        this.$emit('input', val)
      }
    }
  },
  methods: {
    handleChange(val) {
      this.$emit('input', val)
    }
  }
}
</script>
<style scoped>
</style>
