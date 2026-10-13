# 来源与署名

本案例由 geoochi 维护。讲解文字、`preview.svg` 封面，以及 `view.tsx` 中的 RC 串联回路示意图与电压—时间坐标图均为本仓库原创，未使用任何外部图片、纹理或第三方素材，因此不涉及额外的素材许可条款。

原创代码、讲解与图示采用根目录 [MIT 许可证](../../../../LICENSE)，版权归 geoochi 与贡献者所有。物理依据见 `manifest.json` 的 `references` 字段（OpenStax 开放教材《University Physics Volume 2》的“RC Circuits”一节与《College Physics 2e》的“DC Circuits Containing Resistors and Capacitors”一节）。

案例状态为 experimental：内容未经独立的教学审阅。模型假设（理想电源与理想导线、理想电容、线性欧姆电阻、开关在 t = 0 闭合且此后保持闭合）与数值约定（τ = RC、u(t) = E + (u₀ − E)e^(−t/τ)、每步用解析解推进、电容电压是唯一内部状态）见 `manifest.json` 的 `modelAssumptions` 与 `model.ts` 中的注释；本模型只讨论单一 RC 串联回路的暂态过程，不涉及电源内阻、电容漏电、寄生参数或电感效应。
