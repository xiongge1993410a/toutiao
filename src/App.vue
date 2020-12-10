<template>
  <div id="app">
    <!-- keep-alive 仅对该路由出口渲染出来的内容有效 -->
    <keep-alive :include="cachePages">
      <router-view />
    </keep-alive>
  </div>
</template>
<script>
import { mapState } from 'vuex'
export default {
  name: 'App',
  computed: {
    ...mapState(['cachePages'])
  }
}
</script>

<style lang="less"></style>
