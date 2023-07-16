export default () => {
  const a = 1
  const b = 2
  // debugger
  console.log(a, b)
  return <div onClick={() => {
    debugger
  }}>目录很深的文件</div>
}
