<template>
  <div>
    <page-header ref="header" :routerList="list">装饰器语法</page-header>
    <myKeepAlive :include="includeList">
      <router-view :key="urlKey"></router-view>
    </myKeepAlive>
  </div>
</template>
<script lang="ts">
import { Component, Prop, Watch, Vue } from 'vue-property-decorator'
import { RouterItem } from '@/components/pageheader/Interface'
import PageHeader from '@/components/pageheader/PageHeader.vue'
import utils from '@/utils/Utils'
import { Getter } from 'vuex-class'
import myKeepAlive from '@/components/myKeepAlive'
import { addTimestampUrl } from '@/router/RouterHelper'
import { TabStore } from '@/store/storeHelper.ts'

@Component({
  components: { PageHeader, myKeepAlive },
  name: 'Example',
})
export default class BookingClass extends Vue {
  public showHeader = true

  public list: RouterItem[] = [
    {
      url: '/Example/ExampleList',
      name: '列表',
      viewAuthority: [10000, 20000],
    },
  ]
  oldKey = ''
  get urlKey() {
    return 'example-key'
  }
  get includeList(): string[] {
    return []
  }

  @Getter('filterAuthArray')
  filterAuthArray!: Function

  created() {
    // do something
  }
  @Watch('$route', { immediate: true, deep: true })
  onrouterChanged() {
    //  do something
  }
}
</script>
