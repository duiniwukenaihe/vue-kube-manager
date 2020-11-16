<template functional>
  <el-select v-model="valueProxy" v-bind="$attrs" collapse-tags v-on="$listeners">
    <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
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
        return this.$attrs.multiple ? [] : null
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
    return {}
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
  }
}
</script>
