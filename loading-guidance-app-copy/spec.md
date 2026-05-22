# 装车指导 APP

## 📋 业务与功能

### 1.1 核心目标
仓库装车人员的移动端操作界面，支持装车任务列表查看、单据汇总/商品汇总双模式验货、扫码验货全流程操作。

### 1.2 页面清单
- **装车指导列表页**：展示所有待装车的配送任务，支持搜索和扫码
- **任务详情-单据汇总模式页**：以单据为维度展示配送任务下的所有单据，支持多仓库切换
- **任务详情-商品汇总模式页**：以商品为维度展示配送任务下的所有待出库商品，支持多仓库切换
- **扫描验货界面**：针对单个单据进行验货操作

### 1.3 交互流程
1. 列表页 → 点击任务 → 进入任务详情页（根据当前模式进入单据汇总或商品汇总）
2. 单据汇总页/商品汇总页 → 点击仓库标签 → 切换当前查看的仓库数据
3. 单据汇总页 → 点击单据 → 进入扫描验货界面
4. 商品汇总页 → 点击商品 → 进入扫描验货界面
5. 单据汇总 ↔ 商品汇总：通过导航栏右侧下拉按钮切换
6. 扫描验货完成 → 返回任务详情页
7. 所有单据验货完成 → 完成装车 → 返回列表页

---

## 🎨 设计规范

### 2.1 色彩系统
- 主色蓝：#165DFF（链接、选中态）
- 操作蓝：#3B82F6（按钮背景）
- 成功绿：#00B42A（已验货文字）+ #F0FDF4（已验货背景）
- 警告橙：#FF7D00（待验货文字）+ #FFF7ED（待验货背景）
- 部分蓝：#165DFF（部分验货文字）+ #EFF6FF（部分验货背景）
- 页面背景：#F9FAFB
- 卡片背景：#FFFFFF
- 信息区背景：#F9FAFB
- 边框色：#E5E7EB
- 主文字色：#1A1A1A
- 次要文字色：#666666
- 辅助文字色：#999999
- 图标灰色：#9CA3AF

### 2.2 尺寸规范
- 页面宽度：390px（移动端标准）
- 状态栏高度：42px
- 导航栏高度：56px
- 搜索框高度：40px
- 卡片圆角：12px
- 按钮圆角：8px
- 状态标签圆角：4px
- 卡片内边距：16px
- 按钮高度：40px

### 2.3 字体规范
- 标题字号：17px，font-medium
- 任务编号：16px，font-medium
- 正文字号：14px
- 辅助字号：13px
- 标签字号：12px

---

## ⚙️ Axure API 说明

### 3.1 事件列表（eventList）

| 事件名称 | 触发时机 | 说明 |
|---------|---------|------|
| `onBack` | 点击返回按钮 | 返回上一页面 |
| `onSearch` | 搜索框内容变化 | 搜索关键词变化 |
| `onScan` | 点击扫码按钮 | 触发扫码功能 |
| `onTaskClick` | 点击任务项 | 传递任务 ID 和编号 |
| `onPrintLabel` | 点击打印标签按钮 | 传递任务 ID |
| `onComplete` | 点击完成装车按钮 | 传递任务 ID |
| `onModeSwitch` | 切换验货模式 | 传递新模式名称 |
| `onDocClick` | 点击单据项 | 传递单据 ID 和编号 |
| `onProductScan` | 扫描商品 | 传递商品 ID 和条码 |
| `onInspectionComplete` | 完成验货 | 验货完成回调 |

### 3.2 动作列表（actionList）

| 动作名称 | 参数 | 功能描述 |
|---------|------|---------|
| `refreshList` | 无 | 刷新任务列表 |
| `navigateTo` | `{ page: string }` | 导航到指定页面 |
| `updateTaskStatus` | `{ taskId: string; status: string }` | 更新任务状态 |

### 3.3 变量列表（varList）

| 变量名称 | 类型 | 说明 |
|---------|------|------|
| `current_page` | `string` | 当前页面名称 |
| `current_task` | `TaskItem \| null` | 当前选中的任务 |
| `inspection_mode` | `'doc' \| 'product'` | 当前验货模式 |

### 3.4 配置项列表（configList）

| 配置项名称 | 类型 | 默认值 | 说明 |
|----------|------|-------|------|
| `showStatusBar` | `boolean` | `true` | 是否显示系统状态栏 |
| `enableSearch` | `boolean` | `true` | 是否启用搜索功能 |
| `enableScan` | `boolean` | `true` | 是否启用扫码功能 |

### 3.5 数据项列表（dataList）

```typescript
interface TaskItem {
  id: string;
  taskNo: string;
  status: 'pending_inspection' | 'partial_inspection' | 'inspected';
  plateNumber: string;
  driverName: string;
  totalWeight: number;
  totalVolume: number;
}

interface DocItem {
  id: string;
  order: number;
  customerName: string;
  docNo: string;
  productCount: number;
  status: 'inspected' | 'partial_inspection' | 'not_inspected';
  weight: number;
  volume: number;
}

interface ProductItem {
  id: string;
  name: string;
  code: string;
  barcode: string;
  unit: string;
  totalQty: number;
  inspectedQty: number;
  imageUrl?: string;
}

interface WarehouseItem {
  id: string;
  name: string;
  code: string;
}
```
