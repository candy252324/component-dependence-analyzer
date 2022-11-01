import fs from "fs";
import http from "http";

export function openBrowser(result) {
  const data = typeof result === "string" ? result : JSON.stringify(result);
  createServer(data);
}
export function createServer(data) {
  const server = http.createServer();
  server.on("request", (req, res) => {
    res.setHeader("Content-Type", "text/html;charset=utf-8");
    res.write(data);
    res.end();
  });
  server.listen(3345, () => {
    console.log("服务启动成功，浏览器访问：", "http://localhost:3345/");
  });
  server.on("error", (err) => {
    // 端口被占用，(这里判断比较简单，如果端口被占用，则认为已经启动了服务器，不考虑是其它程序占用端口的情况)
    if (err.code === "EADDRINUSE") {
      console.log("http://localhost:3345/");
    }
  });
}
