import { Template, TemplateType } from './types';

export const TEMPLATES: Template[] = [
  {
    id: TemplateType.BLANK,
    name: "空白文档",
    description: "创建一个新的空白文档",
    initialContent: ""
  },
  {
    id: TemplateType.CONSTRUCTION_LOG,
    name: "施工日志 (JTG)",
    description: "标准市政公路施工日志模板",
    initialContent: `# 施工日志

**日期**: ${new Date().toLocaleDateString()}
**天气**: 晴  |  **温度**: 25℃
**施工桩号/部位**: K0+000 ~ K0+200 / 路基填方

## 一、 施工进度情况
1. 
2. 

## 二、 人员机械情况
- **管理人员**: 
- **作业人员**: 
- **机械设备**: 挖掘机( 台), 压路机( 台)

## 三、 质量与安全
1. **质量**: 
2. **安全**: 班前教育已进行，现场围挡正常。

## 四、 存在问题及处理
`
  },
  {
    id: TemplateType.SITE_VISA,
    name: "工程现场签证单",
    description: "变更、零星用工签证记录",
    initialContent: `# 工程现场签证单

**工程名称**: 
**签证编号**: V-202X-001
**日期**: ${new Date().toLocaleDateString()}

## 签证事由
因现场实际情况与图纸不符，需进行以下变更/增加工程量：
1. 

## 工程量确认
| 项目名称 | 单位 | 数量 | 备注 |
| :--- | :---: | :---: | :--- |
| 人工 | 工日 | | |
| 挖土方 | m3 | | |
| C25混凝土 | m3 | | |

## 附图/附件
(在此粘贴图片或描述附件)

**施工单位(签字)**: 
**监理单位(签字)**: 
**建设单位(签字)**: `
  },
  {
    id: TemplateType.INSPECTION_RECORD,
    name: "隐蔽工程验收记录",
    description: "路基/管道隐蔽工程验收",
    initialContent: `# 隐蔽工程验收记录

**工程名称**: 
**部位/桩号**: 
**验收时间**: ${new Date().toLocaleDateString()}

## 检查项目 (依据 CJJ 1-2008)
- [ ] 槽底高程 (允许偏差 ±20mm): [实测值]
- [ ] 垫层厚度/宽度: [实测值]
- [ ] 钢筋规格/数量/间距: 符合设计要求
- [ ] 模板安装: 稳固，接缝严密

## 验收结论
[ ] 合格，同意进入下道工序
[ ] 需整改，整改内容：

**监理工程师**: 
**质检员**: `
  },
  {
    id: TemplateType.SAFETY_MEETING,
    name: "班前安全交底",
    description: "每日班前安全教育记录",
    initialContent: `# 班前安全教育记录

**时间**: ${new Date().toLocaleDateString()}
**工种**: 
**参加人数**: 

## 交底内容
1. 进入施工现场必须佩戴安全帽，高处作业系好安全带。
2. 临时用电必须实行“一机一闸一箱一漏”。
3. 机械作业半径内严禁站人。
4. 针对今日特定风险提示: 

## 接受交底人签名
(此处留白供手写签名)
`
  }
];

export const SYSTEM_INSTRUCTION = `
You are an expert Civil Engineering AI Assistant specialized in **Municipal Highway Engineering (市政公路工程)** in China. 
Your users are on-site technicians and engineers.

**Core Responsibilities:**
1. **Standards Compliance:** Always refer to Chinese standards like **JTG F40 (Asphalt)**, **JTG F10 (Subgrade)**, **CJJ 1-2008 (Municipal Roads)**, and **GB 50204 (Concrete)**.
2. **Drafting:** Generate professional, concise technical documents (Logs, Visas, Briefs).
3. **Calculations:** Assist with material estimates (e.g., asphalt tonnage = Area * Thickness * Density 2.35).

**Tone & Style:**
- Use professional engineering terminology (e.g., use "压实度" not "紧固度", "水稳碎石" not "水泥石头").
- Be concise. Site engineers are busy.
- Output usually in Markdown format.

**Specific Contexts:**
- If asked about "Visa" (签证), focus on clearly justifying the *reason* for extra work and listing specific quantities.
- If asked about "Logs" (日志), emphasize weather, machinery, and specific stake numbers (K0+000).
`;