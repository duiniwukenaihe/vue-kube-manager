<template>
  <div class="dashboard-container">
    <iframe id="ifr1" src="http://master160:3000/d/F2sumsMMz/pai_clusterview?orgId=1&refresh=30s&kiosk" name="ifr1">
      <p>您的浏览器不支持iframe内嵌页面</p>
      <p>Your browser does not support iframes.</p>
    </iframe>
  </div>
</template>

<script>
export default {
  name: 'Dashboard',
  computed: {
  }
}
</script>

<style lang="scss" scoped>
.dashboard {
  &-container {
    margin: 30px;
  }
  &-text {
    font-size: 30px;
    line-height: 46px;
  }
}

#ifr1 {
  width: 100%;
  height: 820px;
  border: none;
}
</style>
