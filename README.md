## Plugin Options

The plugin accepts an options object when calling `app.use(PerfMonitor, options)`.  
All options are **optional**.

| Option       | Type      | Default | Description |
| ------------ | --------- | ------- | ----------- |
| `enabled`    | `boolean` | `true`  | Whether to enable the plugin. If `false`, monitoring is disabled completely. |
| `threshold`  | `number`  | `16.6`  | Threshold in milliseconds. If a timer callback exceeds this value, a warning is logged in the console. |


```javascript
//推荐动态加载插件
if (import.meta.env.DEV) {
    import('./monitor').then(({ default: perfMonitorPlugin }) => {
      app.use(perfMonitorPlugin, {
        threshold: 20
      })
    })
  }
```