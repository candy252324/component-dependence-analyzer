<template>
  <div class="body">
    {{ text }}
    <!-- type 2 -->
    footer1

    <!-- type 5 -->
    {{ footer2 }}

    <!-- 注释节点 type3 -->
    <!-- <footer3></footer3> -->

    <!-- type 1 ,tagType 0-->
    <footer4></footer4>

    <!-- type1 tagType 0 ,isSelfClosing：true-->
    <footer2 />

    <!-- type1 tagtype0 -->
    <!-- <FooterComp></FooterComp> -->

    <!-- type1 tagtype0 -->
    <!-- <footer-comp></footer-comp> -->
  </div>
</template>

<script lang="ts">
import { ref } from 'vue'
import Footer from './footer'
import footer2 from './footer2'
import footerComp from './footer3'

export default {
  setup() {
    const text = ref('body')
    return {
      text,
    }
  },
}
</script>

<style lang="less" scoped>
.body {
  width: 100px;
  height: 100px;
  border-radius: 8px;
  border: 2px solid @primary-color;
  display: flex;
  justify-content: center;
  align-items: center;
  color: @primary-color;
  margin: 5px;
}
</style>
