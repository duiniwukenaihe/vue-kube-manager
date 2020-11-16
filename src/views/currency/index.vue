<template>
  <div class="app">
    <section>
      <mone-query
        ref="moneQuery"
        border
        show-action
        show-index
        :config="config"
        :data="data"
        :formatters="formatters"
        rows-name="result"
        @delete="handleDelete"
        @search="handleSearch"
        @data-success="handleSearchSuccess"
        @data-error="handleSearchError"
        @data-complete="handleSearchComplete"
      >
        <template slot-scope="{ row }">
          <el-button
            type="default"
            @click="handleEdit(row)"
          >
            编辑
          </el-button>
        </template>
      </mone-query>
    </section>
  </div>
</template>

<script>
// refer to https://github.com/jczzq/mone-query
import MoneQuery from '@/components/MoneQuery'

export default {
  name: 'CurrencyTable',
  components: { MoneQuery },
  data() {
    return {
      listLoading: true,
      config: 'LIST_USER',
      data: 'LIST_USER',
      formatters: {
      }
    }
  },
  methods: {
    handleDelete(selection) {
      console.log('delete event: ', selection)
    },
    handleSearch(parameters) {
      console.log('search event: ', parameters)
    },
    handleSearchError(e) {
      console.log('data-error event: ', e)
    },
    handleSearchSuccess(res) {
      console.log('data-success event: ', res)
    },
    handleSearchComplete() {
      console.log('data-complete event')
    },
    handleCleanSelection() {
      this.$refs.moneQuery.$refs[this.$refs.moneQuery.tableId].clearSelection()
    }
  }
}
</script>

<style lang="scss">

</style>
