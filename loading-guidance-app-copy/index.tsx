/**
 * @name 装车指导 APP 副本
 *
 * 参考资料：Calicat 设计稿 2046144071611187200
 */

import './style.css';
import React, { forwardRef, useCallback, useImperativeHandle, useState } from 'react';
import {
  Search,
  ScanLine,
  ChevronRight,
  ChevronDown,
  Battery,
  Wifi,
  Signal,
  ArrowLeft,
  Minus,
  Plus,
  ChevronUp,
  Package,
  Image as ImageIcon,
} from 'lucide-react';

import type {
  AxureHandle,
  AxureProps,
  ConfigItem,
  DataDesc,
  EventItem,
  KeyDesc,
  Action,
} from '../../common/axure-types';

type TaskStatus = 'pending_inspection' | 'partial_inspection' | 'inspected';

type PageName = 'list' | 'doc-summary' | 'product-summary' | 'scan-inspection';

interface TaskItem {
  id: string;
  taskNo: string;
  status: TaskStatus;
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

const EVENT_LIST: EventItem[] = [
  { name: 'onBack', desc: '点击返回按钮' },
  { name: 'onSearch', desc: '搜索框内容变化' },
  { name: 'onScan', desc: '点击扫码按钮' },
  { name: 'onTaskClick', desc: '点击任务项' },
  { name: 'onPrintLabel', desc: '点击打印标签按钮' },
  { name: 'onComplete', desc: '点击完成装车按钮' },
  { name: 'onModeSwitch', desc: '切换验货模式' },
  { name: 'onDocClick', desc: '点击单据项' },
  { name: 'onProductScan', desc: '扫描商品' },
  { name: 'onInspectionComplete', desc: '完成验货' },
];

const ACTION_LIST: Action[] = [
  { name: 'refreshList', desc: '刷新任务列表' },
  { name: 'navigateTo', desc: '导航到指定页面，参数：{ page: string }' },
  { name: 'updateTaskStatus', desc: '更新任务状态，参数：{ taskId: string; status: string }' },
];

const VAR_LIST: KeyDesc[] = [
  { name: 'current_page', desc: '当前页面名称' },
  { name: 'current_task', desc: '当前选中的任务' },
  { name: 'inspection_mode', desc: '当前验货模式：doc | product' },
];

const CONFIG_LIST: ConfigItem[] = [
  { type: 'checkbox', attributeId: 'showStatusBar', displayName: '显示状态栏', info: '是否显示系统状态栏', initialValue: true },
  { type: 'checkbox', attributeId: 'enableSearch', displayName: '启用搜索', info: '是否启用搜索功能', initialValue: true },
  { type: 'checkbox', attributeId: 'enableScan', displayName: '启用扫码', info: '是否启用扫码功能', initialValue: true },
];

const DATA_LIST: DataDesc[] = [
  {
    name: 'tasks',
    desc: '装车任务列表',
    keys: [
      { name: 'id', desc: '任务ID' },
      { name: 'taskNo', desc: '任务编号' },
      { name: 'status', desc: '任务状态' },
      { name: 'plateNumber', desc: '车牌号' },
      { name: 'driverName', desc: '司机姓名' },
      { name: 'totalWeight', desc: '总重量(吨)' },
      { name: 'totalVolume', desc: '总体积(m³)' },
    ],
  },
];

const MOCK_TASKS: TaskItem[] = [
  { id: '1', taskNo: 'PD-20240709-00001', status: 'pending_inspection', plateNumber: '川A·OZ888', driverName: '王一博', totalWeight: 0.025, totalVolume: 0.025 },
  { id: '2', taskNo: 'PD-20240709-00002', status: 'inspected', plateNumber: '川B·12345', driverName: '张三', totalWeight: 1.5, totalVolume: 2.3 },
  { id: '3', taskNo: 'PD-20240709-00003', status: 'partial_inspection', plateNumber: '川C·67890', driverName: '李四', totalWeight: 0.8, totalVolume: 1.2 },
  { id: '4', taskNo: 'PD-20240709-00004', status: 'inspected', plateNumber: '川D·11223', driverName: '王五', totalWeight: 2.1, totalVolume: 3.0 },
];

const MOCK_DOCS: DocItem[] = [
  { id: 'd1', order: 1, customerName: '成都华润万家超市', docNo: 'SO-20240709-001', productCount: 5, status: 'not_inspected', weight: 0.5, volume: 0.3 },
  { id: 'd2', order: 2, customerName: '绵阳永辉超市', docNo: 'SO-20240709-002', productCount: 3, status: 'partial_inspection', weight: 0.3, volume: 0.2 },
  { id: 'd3', order: 3, customerName: '德阳大润发', docNo: 'SO-20240709-003', productCount: 8, status: 'inspected', weight: 1.2, volume: 0.8 },
  { id: 'd4', order: 4, customerName: '南充家乐福', docNo: 'SO-20240709-004', productCount: 2, status: 'not_inspected', weight: 0.1, volume: 0.1 },
  { id: 'd5', order: 5, customerName: '宜宾沃尔玛', docNo: 'SO-20240709-005', productCount: 6, status: 'not_inspected', weight: 0.8, volume: 0.6 },
];

const MOCK_PRODUCTS: ProductItem[] = [
  { id: 'p1', name: '可口可乐330ml', code: 'SP001', barcode: '6901939621066', unit: '箱', totalQty: 10, inspectedQty: 0 },
  { id: 'p2', name: '农夫山泉550ml', code: 'SP002', barcode: '6921168593058', unit: '箱', totalQty: 8, inspectedQty: 3 },
  { id: 'p3', name: '康师傅红烧牛肉面', code: 'SP003', barcode: '6920584490011', unit: '箱', totalQty: 15, inspectedQty: 0 },
  { id: 'p4', name: '蒙牛纯牛奶250ml', code: 'SP004', barcode: '6907992500904', unit: '箱', totalQty: 20, inspectedQty: 0 },
  { id: 'p5', name: '奥利奥原味饼干', code: 'SP005', barcode: '6901668044233', unit: '箱', totalQty: 5, inspectedQty: 5 },
  { id: 'p6', name: '统一老坛酸菜面', code: 'SP006', barcode: '6925303721367', unit: '箱', totalQty: 12, inspectedQty: 0 },
];

const MOCK_WAREHOUSES: WarehouseItem[] = [
  { id: 'w1', name: '成都主仓库', code: 'CD-001' },
  { id: 'w2', name: '绵阳分仓', code: 'MY-002' },
  { id: 'w3', name: '德阳分仓', code: 'DY-003' },
];

const STATUS_CONFIG: Record<TaskStatus, { label: string; bgColor: string; textColor: string }> = {
  pending_inspection: { label: '待验货', bgColor: 'bg-orange-50', textColor: 'text-orange-500' },
  partial_inspection: { label: '部分验货', bgColor: 'bg-blue-50', textColor: 'text-blue-600' },
  inspected: { label: '已验货', bgColor: 'bg-green-50', textColor: 'text-green-600' },
};

const DOC_STATUS_CONFIG: Record<string, { label: string; bgColor: string; textColor: string }> = {
  not_inspected: { label: '未验货', bgColor: 'bg-orange-50', textColor: 'text-orange-500' },
  partial_inspection: { label: '部分验货', bgColor: 'bg-blue-50', textColor: 'text-blue-600' },
  inspected: { label: '已验货', bgColor: 'bg-green-50', textColor: 'text-green-600' },
};

const StatusBar = () => (
  <div className="lg-status-bar">
    <div className="lg-status-bar-left">
      <span className="lg-status-bar-text">中国移动</span>
      <Wifi size={14} />
    </div>
    <span className="lg-status-bar-time">9:41 AM</span>
    <div className="lg-status-bar-right">
      <Signal size={14} />
      <span className="lg-status-bar-text">100%</span>
      <Battery size={16} />
    </div>
  </div>
);

const NavBar = ({ title, onBack, rightAction }: { title: string; onBack?: () => void; rightAction?: React.ReactNode }) => (
  <div className="lg-nav-bar">
    {onBack ? (
      <button className="lg-nav-back" onClick={onBack}>
        <ArrowLeft size={20} />
      </button>
    ) : <div className="lg-nav-back" />}
    <h1 className="lg-nav-title">{title}</h1>
    {rightAction || <div className="lg-nav-back" />}
  </div>
);

const WarehouseNavBar = ({ warehouses, activeWarehouseId, onWarehouseChange }: {
  warehouses: WarehouseItem[];
  activeWarehouseId: string;
  onWarehouseChange: (warehouseId: string) => void;
}) => {
  if (warehouses.length <= 1) return null;

  return (
    <div className="lg-warehouse-nav">
      <div className="lg-warehouse-nav-scroll">
        {warehouses.map((warehouse) => (
          <button
            key={warehouse.id}
            className={`lg-warehouse-item ${warehouse.id === activeWarehouseId ? 'lg-warehouse-active' : ''}`}
            onClick={() => onWarehouseChange(warehouse.id)}
          >
            {warehouse.name}
          </button>
        ))}
      </div>
    </div>
  );
};

const StatusBadge = ({ status, configMap }: { status: string; configMap: Record<string, { label: string; bgColor: string; textColor: string }> }) => {
  const config = configMap[status];
  if (!config) return null;
  return (
    <span className={`lg-status-badge ${config.bgColor} ${config.textColor}`}>
      {config.label}
    </span>
  );
};

function ListPage({ tasks, onTaskClick, onPrint, onComplete, onScan, onBack }: {
  tasks: TaskItem[];
  onTaskClick: (task: TaskItem) => void;
  onPrint: (id: string) => void;
  onComplete: (id: string) => void;
  onScan: () => void;
  onBack: () => void;
}) {
  const [searchKeyword, setSearchKeyword] = useState('');

  const filteredTasks = tasks.filter((task) =>
    !searchKeyword ||
    task.taskNo.toLowerCase().includes(searchKeyword.toLowerCase()) ||
    task.plateNumber.includes(searchKeyword) ||
    task.driverName.includes(searchKeyword)
  );

  return (
    <div className="lg-page">
      <StatusBar />
      <NavBar title="装车指导" onBack={onBack} />
      <div className="lg-search-bar">
        <div className="lg-search-box">
          <Search size={18} className="lg-search-icon" />
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="搜索配送任务/车牌/司机"
            className="lg-search-input"
          />
          <button onClick={onScan} className="lg-scan-btn">
            <ScanLine size={18} className="lg-search-icon" />
          </button>
        </div>
      </div>
      <div className="lg-task-list">
        {filteredTasks.length > 0 ? (
          filteredTasks.map((task) => (
            <div key={task.id} className="lg-task-card" onClick={() => onTaskClick(task)}>
              <div className="lg-task-header">
                <span className="lg-task-no">{task.taskNo}</span>
                <div className="lg-task-header-right">
                  <StatusBadge status={task.status} configMap={STATUS_CONFIG} />
                  <ChevronRight size={18} className="lg-chevron-icon" />
                </div>
              </div>
              <div className="lg-task-info">
                <div className="lg-info-row">
                  <div className="lg-info-group">
                    <span className="lg-info-label">车牌号：</span>
                    <span className="lg-info-value lg-info-value-blue">{task.plateNumber}</span>
                  </div>
                  <div className="lg-info-group">
                    <span className="lg-info-label">司机：</span>
                    <span className="lg-info-value">{task.driverName}</span>
                  </div>
                </div>
                <div className="lg-info-row">
                  <div className="lg-info-group">
                    <span className="lg-info-label">总重量：</span>
                    <span className="lg-info-value">{task.totalWeight}吨</span>
                  </div>
                  <div className="lg-info-group">
                    <span className="lg-info-label">总体积：</span>
                    <span className="lg-info-value">{task.totalVolume}m³</span>
                  </div>
                </div>
              </div>
              <div className="lg-task-actions" onClick={(e) => e.stopPropagation()}>
                <button className="lg-btn-outline" onClick={() => onPrint(task.id)}>
                  打印商品标签
                </button>
                <button
                  className={`lg-btn-primary ${task.status !== 'inspected' ? 'lg-btn-disabled' : ''}`}
                  onClick={() => onComplete(task.id)}
                  disabled={task.status !== 'inspected'}
                >
                  完成装车
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="lg-empty-state">
            <p>暂无匹配的任务</p>
          </div>
        )}
      </div>
    </div>
  );
}

function DocSummaryPage({ task, docs, onDocClick, onComplete, onBack, onModeSwitch, warehouses, activeWarehouseId, onWarehouseChange }: {
  task: TaskItem;
  docs: DocItem[];
  onDocClick: (doc: DocItem) => void;
  onComplete: () => void;
  onBack: () => void;
  onModeSwitch: () => void;
  warehouses: WarehouseItem[];
  activeWarehouseId: string;
  onWarehouseChange: (warehouseId: string) => void;
}) {
  const [scanInput, setScanInput] = useState('');
  const allInspected = docs.every((d) => d.status === 'inspected');

  return (
    <div className="lg-page">
      <StatusBar />
      <NavBar
        title="任务详情-单据汇总"
        onBack={onBack}
        rightAction={
          <button className="lg-mode-switch-btn" onClick={onModeSwitch}>
            <ChevronDown size={14} />
            <span className="lg-mode-switch-text">单据汇总</span>
          </button>
        }
      />
      <WarehouseNavBar
        warehouses={warehouses}
        activeWarehouseId={activeWarehouseId}
        onWarehouseChange={onWarehouseChange}
      />
      <div className="lg-scan-bar">
        <div className="lg-scan-box">
          <ScanLine size={18} className="lg-search-icon" />
          <input
            type="text"
            value={scanInput}
            onChange={(e) => setScanInput(e.target.value)}
            placeholder="请扫描单据编号/任务单号"
            className="lg-search-input"
            autoFocus
          />
        </div>
      </div>
      <div className="lg-doc-list">
        {docs.map((doc) => (
          <div
            key={doc.id}
            className={`lg-doc-card ${doc.status === 'inspected' ? 'lg-doc-card-done' : ''}`}
            onClick={() => doc.status !== 'inspected' && onDocClick(doc)}
          >
            <div className="lg-doc-header">
              <div className="lg-doc-order">{doc.order}</div>
              <div className="lg-doc-main">
                <div className="lg-doc-customer">{doc.customerName}</div>
                <div className="lg-doc-no">{doc.docNo}</div>
              </div>
              <div className="lg-doc-right">
                <StatusBadge status={doc.status} configMap={DOC_STATUS_CONFIG} />
                {doc.status !== 'inspected' && <ChevronRight size={16} className="lg-chevron-icon" />}
              </div>
            </div>
            <div className="lg-doc-info">
              <span className="lg-doc-info-item">{doc.productCount}种商品</span>
              <span className="lg-doc-info-divider">|</span>
              <span className="lg-doc-info-item">{doc.weight}吨</span>
              <span className="lg-doc-info-divider">|</span>
              <span className="lg-doc-info-item">{doc.volume}m³</span>
            </div>
          </div>
        ))}
      </div>
      <div className="lg-bottom-action">
        <button
          className={`lg-btn-primary lg-btn-full ${!allInspected ? 'lg-btn-disabled' : ''}`}
          disabled={!allInspected}
          onClick={onComplete}
        >
          完成装车
        </button>
      </div>
    </div>
  );
}

function ProductSummaryPage({ task, products, onBack, onModeSwitch, onProductClick, warehouses, activeWarehouseId, onWarehouseChange, onComplete }: {
  task: TaskItem;
  products: ProductItem[];
  onBack: () => void;
  onModeSwitch: () => void;
  onProductClick: (product: ProductItem) => void;
  warehouses: WarehouseItem[];
  activeWarehouseId: string;
  onWarehouseChange: (warehouseId: string) => void;
  onComplete: () => void;
}) {
  const [scanInput, setScanInput] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'inspected'>('pending');
  const [productQtys, setProductQtys] = useState<Record<string, number>>({});

  const pendingProducts = products.filter((p) => p.inspectedQty < p.totalQty);
  const inspectedProducts = products.filter((p) => p.inspectedQty >= p.totalQty);
  const diffCount = products.reduce((sum, p) => sum + Math.max(0, p.totalQty - p.inspectedQty), 0);
  const allInspected = products.every((p) => p.inspectedQty >= p.totalQty);

  const handleQtyChange = (productId: string, delta: number) => {
    setProductQtys((prev) => {
      const current = prev[productId] ?? 0;
      return { ...prev, [productId]: Math.max(0, current + delta) };
    });
  };

  const handleScan = () => {
    if (!scanInput.trim()) return;
    const found = products.find((p) => p.barcode === scanInput || p.code === scanInput);
    if (found) {
      handleQtyChange(found.id, 1);
      setScanInput('');
    } else {
      setScanInput('');
    }
  };

  const displayProducts = activeTab === 'pending' ? pendingProducts : inspectedProducts;

  return (
    <div className="lg-page">
      <StatusBar />
      <NavBar
        title="任务详情-商品汇总"
        onBack={onBack}
        rightAction={
          <button className="lg-mode-switch-btn" onClick={onModeSwitch}>
            <ChevronDown size={14} />
            <span className="lg-mode-switch-text">商品汇总</span>
          </button>
        }
      />
      <WarehouseNavBar
        warehouses={warehouses}
        activeWarehouseId={activeWarehouseId}
        onWarehouseChange={onWarehouseChange}
      />
      <div className="lg-scan-bar">
        <div className="lg-scan-box">
          <ScanLine size={18} className="lg-search-icon" />
          <input
            type="text"
            value={scanInput}
            onChange={(e) => setScanInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleScan()}
            placeholder="请扫描商品条码/编码/序列号"
            className="lg-search-input"
            autoFocus
          />
        </div>
      </div>
      <div className="lg-tab-bar">
        <button
          className={`lg-tab-item ${activeTab === 'pending' ? 'lg-tab-active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          待验货
          {pendingProducts.length > 0 && <span className="lg-tab-badge">{pendingProducts.length}</span>}
        </button>
        <button
          className={`lg-tab-item ${activeTab === 'inspected' ? 'lg-tab-active' : ''}`}
          onClick={() => setActiveTab('inspected')}
        >
          已验货
          {inspectedProducts.length > 0 && <span className="lg-tab-badge lg-tab-badge-green">{inspectedProducts.length}</span>}
        </button>
      </div>
      <div className="lg-product-list">
        {displayProducts.map((product) => {
          const currentQty = productQtys[product.id] ?? product.inspectedQty;
          return (
            <div key={product.id} className="lg-product-card">
              <div className="lg-product-image">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} className="lg-product-img" />
                ) : (
                  <ImageIcon size={24} className="lg-product-img-placeholder" />
                )}
              </div>
              <div className="lg-product-info">
                <div className="lg-product-name">{product.name}</div>
                <div className="lg-product-meta">
                  <span>{product.code}</span>
                  <span className="lg-product-meta-divider">|</span>
                  <span>{product.barcode}</span>
                  <span className="lg-product-meta-divider">|</span>
                  <span>{product.unit}</span>
                </div>
                <div className="lg-product-qty-row">
                  <span className="lg-product-total">总数量：{product.totalQty}{product.unit}</span>
                  <div className="lg-qty-control" onClick={(e) => e.stopPropagation()}>
                    <button className="lg-qty-btn" onClick={() => handleQtyChange(product.id, -1)}>
                      <Minus size={14} />
                    </button>
                    <input
                      type="text"
                      value={currentQty}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setProductQtys((prev) => ({ ...prev, [product.id]: Math.max(0, val) }));
                      }}
                      className="lg-qty-input"
                    />
                    <button className="lg-qty-btn" onClick={() => handleQtyChange(product.id, 1)}>
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {displayProducts.length === 0 && (
          <div className="lg-empty-state">
            <p>{activeTab === 'pending' ? '所有商品已验货完成' : '暂无已验货商品'}</p>
          </div>
        )}
      </div>
      <div className="lg-bottom-action">
        <button
          className="lg-btn-primary lg-btn-full"
          onClick={onComplete}
        >
          完成验货
        </button>
      </div>
    </div>
  );
}

function ScanInspectionPage({ docNo, products, onBack, onComplete }: {
  docNo: string;
  products: ProductItem[];
  onBack: () => void;
  onComplete: () => void;
}) {
  const [scanInput, setScanInput] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'inspected'>('pending');
  const [productQtys, setProductQtys] = useState<Record<string, number>>({});

  const pendingProducts = products.filter((p) => (productQtys[p.id] ?? p.inspectedQty) < p.totalQty);
  const inspectedProducts = products.filter((p) => (productQtys[p.id] ?? p.inspectedQty) >= p.totalQty);

  const handleQtyChange = (productId: string, delta: number) => {
    setProductQtys((prev) => {
      const current = prev[productId] ?? 0;
      return { ...prev, [productId]: Math.max(0, current + delta) };
    });
  };

  const handleScan = () => {
    if (!scanInput.trim()) return;
    const found = products.find((p) => p.barcode === scanInput || p.code === scanInput);
    if (found) {
      handleQtyChange(found.id, 1);
      setScanInput('');
    } else {
      setScanInput('');
    }
  };

  const displayProducts = activeTab === 'pending' ? pendingProducts : inspectedProducts;

  return (
    <div className="lg-page">
      <StatusBar />
      <NavBar title="扫描验货" onBack={onBack} />
      <div className="lg-doc-info-header">
        <span className="lg-doc-info-no">{docNo}</span>
        <StatusBadge status="partial_inspection" configMap={DOC_STATUS_CONFIG} />
      </div>
      <div className="lg-scan-bar">
        <div className="lg-scan-box">
          <ScanLine size={18} className="lg-search-icon" />
          <input
            type="text"
            value={scanInput}
            onChange={(e) => setScanInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleScan()}
            placeholder="扫描商品条码/编码/序列号"
            className="lg-search-input"
            autoFocus
          />
        </div>
      </div>
      <div className="lg-tab-bar">
        <button
          className={`lg-tab-item ${activeTab === 'pending' ? 'lg-tab-active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          待验货
          {pendingProducts.length > 0 && <span className="lg-tab-badge">{pendingProducts.length}</span>}
        </button>
        <button
          className={`lg-tab-item ${activeTab === 'inspected' ? 'lg-tab-active' : ''}`}
          onClick={() => setActiveTab('inspected')}
        >
          已验货
          {inspectedProducts.length > 0 && <span className="lg-tab-badge lg-tab-badge-green">{inspectedProducts.length}</span>}
        </button>
      </div>
      <div className="lg-product-list">
        {displayProducts.map((product) => {
          const currentQty = productQtys[product.id] ?? product.inspectedQty;
          return (
            <div key={product.id} className="lg-product-card">
              <div className="lg-product-image">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} className="lg-product-img" />
                ) : (
                  <Package size={24} className="lg-product-img-placeholder" />
                )}
              </div>
              <div className="lg-product-info">
                <div className="lg-product-name">{product.name}</div>
                <div className="lg-product-meta">
                  <span>{product.code}</span>
                  <span className="lg-product-meta-divider">|</span>
                  <span>{product.barcode}</span>
                  <span className="lg-product-meta-divider">|</span>
                  <span>{product.unit}</span>
                </div>
                <div className="lg-product-qty-row">
                  <span className="lg-product-total">应出：{product.totalQty}{product.unit}</span>
                  <div className="lg-qty-control">
                    <button className="lg-qty-btn" onClick={() => handleQtyChange(product.id, -1)}>
                      <Minus size={14} />
                    </button>
                    <input
                      type="text"
                      value={currentQty}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setProductQtys((prev) => ({ ...prev, [product.id]: Math.max(0, val) }));
                      }}
                      className="lg-qty-input"
                    />
                    <button className="lg-qty-btn" onClick={() => handleQtyChange(product.id, 1)}>
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="lg-bottom-action">
        <button className="lg-btn-primary lg-btn-full" onClick={onComplete}>
          完成验货
        </button>
      </div>
    </div>
  );
}

const Component = forwardRef<AxureHandle, AxureProps>(function LoadingGuidanceApp(innerProps, ref) {
  const onEventHandler = typeof innerProps?.onEvent === 'function' ? innerProps.onEvent : () => undefined;

  const [currentPage, setCurrentPage] = useState<PageName>('list');
  const [currentTask, setCurrentTask] = useState<TaskItem | null>(null);
  const [currentDocNo, setCurrentDocNo] = useState<string>('');
  const [inspectionMode, setInspectionMode] = useState<'doc' | 'product'>('doc');
  const [showModeDropdown, setShowModeDropdown] = useState(false);
  const [activeWarehouseId, setActiveWarehouseId] = useState<string>('w1');

  const emitEvent = useCallback((eventName: string, payload?: Record<string, unknown>) => {
    try {
      onEventHandler(eventName, payload ? JSON.stringify(payload) : undefined);
    } catch (error) {
      console.warn('事件触发失败:', error);
    }
  }, [onEventHandler]);

  const handleTaskClick = useCallback((task: TaskItem) => {
    setCurrentTask(task);
    if (inspectionMode === 'doc') {
      setCurrentPage('doc-summary');
    } else {
      setCurrentPage('product-summary');
    }
    emitEvent('onTaskClick', { taskId: task.id, taskNo: task.taskNo });
  }, [inspectionMode, emitEvent]);

  const handleDocClick = useCallback((doc: DocItem) => {
    setCurrentDocNo(doc.docNo);
    setCurrentPage('scan-inspection');
    emitEvent('onDocClick', { docId: doc.id, docNo: doc.docNo });
  }, [emitEvent]);

  const handleModeSwitch = useCallback(() => {
    setShowModeDropdown((prev) => !prev);
  }, []);

  const switchToDocMode = useCallback(() => {
    setInspectionMode('doc');
    setCurrentPage('doc-summary');
    setShowModeDropdown(false);
    emitEvent('onModeSwitch', { mode: 'doc' });
  }, [emitEvent]);

  const switchToProductMode = useCallback(() => {
    setInspectionMode('product');
    setCurrentPage('product-summary');
    setShowModeDropdown(false);
    emitEvent('onModeSwitch', { mode: 'product' });
  }, [emitEvent]);

  const handleBack = useCallback(() => {
    if (currentPage === 'scan-inspection') {
      setCurrentPage(inspectionMode === 'doc' ? 'doc-summary' : 'product-summary');
    } else if (currentPage === 'doc-summary' || currentPage === 'product-summary') {
      setCurrentPage('list');
      setCurrentTask(null);
    } else {
      emitEvent('onBack');
    }
  }, [currentPage, inspectionMode, emitEvent]);

  const handlePrint = useCallback((taskId: string) => {
    emitEvent('onPrintLabel', { taskId });
  }, [emitEvent]);

  const handleComplete = useCallback((taskId: string) => {
    emitEvent('onComplete', { taskId });
  }, [emitEvent]);

  const handleScan = useCallback(() => {
    emitEvent('onScan');
  }, [emitEvent]);

  const handleInspectionComplete = useCallback(() => {
    setCurrentPage(inspectionMode === 'doc' ? 'doc-summary' : 'product-summary');
    emitEvent('onInspectionComplete');
  }, [inspectionMode, emitEvent]);

  const handleCompleteLoading = useCallback(() => {
    setCurrentPage('list');
    setCurrentTask(null);
    emitEvent('onComplete', { taskId: currentTask?.id });
  }, [currentTask, emitEvent]);

  const handleProductClick = useCallback((product: ProductItem) => {
    setCurrentDocNo('');
    setCurrentPage('scan-inspection');
    emitEvent('onProductScan', { productId: product.id, barcode: product.barcode });
  }, [emitEvent]);

  const handleWarehouseChange = useCallback((warehouseId: string) => {
    setActiveWarehouseId(warehouseId);
  }, []);

  useImperativeHandle(ref, () => ({
    getVar(name: string) {
      const vars: Record<string, unknown> = {
        current_page: currentPage,
        current_task: currentTask,
        inspection_mode: inspectionMode,
      };
      return vars[name];
    },
    fireAction(name: string, params?: string) {
      let payload: Record<string, unknown> | null = null;
      if (params) {
        try { payload = JSON.parse(params); } catch { payload = null; }
      }
      switch (name) {
        case 'refreshList':
          return;
        case 'navigateTo': {
          const page = typeof payload?.page === 'string' ? payload.page : '';
          if (page) setCurrentPage(page as PageName);
          return;
        }
        case 'updateTaskStatus':
          return;
        default:
          console.warn('未知的动作:', name);
      }
    },
    eventList: EVENT_LIST,
    actionList: ACTION_LIST,
    varList: VAR_LIST,
    configList: CONFIG_LIST,
    dataList: DATA_LIST,
  }), [currentPage, currentTask, inspectionMode]);

  let pageContent: React.ReactNode;

  if (currentPage === 'doc-summary' && currentTask) {
    pageContent = (
      <DocSummaryPage
        task={currentTask}
        docs={MOCK_DOCS}
        onDocClick={handleDocClick}
        onComplete={handleCompleteLoading}
        onBack={handleBack}
        onModeSwitch={handleModeSwitch}
        warehouses={MOCK_WAREHOUSES}
        activeWarehouseId={activeWarehouseId}
        onWarehouseChange={handleWarehouseChange}
      />
    );
  } else if (currentPage === 'product-summary' && currentTask) {
    pageContent = (
      <ProductSummaryPage
        task={currentTask}
        products={MOCK_PRODUCTS}
        onBack={handleBack}
        onModeSwitch={handleModeSwitch}
        onProductClick={handleProductClick}
        warehouses={MOCK_WAREHOUSES}
        activeWarehouseId={activeWarehouseId}
        onWarehouseChange={handleWarehouseChange}
        onComplete={handleCompleteLoading}
      />
    );
  } else if (currentPage === 'scan-inspection') {
    pageContent = (
      <ScanInspectionPage
        docNo={currentDocNo || 'SO-20240709-001'}
        products={MOCK_PRODUCTS}
        onBack={handleBack}
        onComplete={handleInspectionComplete}
      />
    );
  } else {
    pageContent = (
      <ListPage
        tasks={MOCK_TASKS}
        onTaskClick={handleTaskClick}
        onPrint={handlePrint}
        onComplete={handleComplete}
        onScan={handleScan}
        onBack={() => emitEvent('onBack')}
      />
    );
  }

  return (
    <div className="lg-app-container">
      {pageContent}
      {showModeDropdown && (
        <div className="lg-mode-dropdown-overlay" onClick={() => setShowModeDropdown(false)}>
          <div className="lg-mode-dropdown" onClick={(e) => e.stopPropagation()}>
            <button
              className={`lg-mode-dropdown-item ${inspectionMode === 'doc' ? 'lg-mode-dropdown-active' : ''}`}
              onClick={switchToDocMode}
            >
              单据汇总
              {inspectionMode === 'doc' && <span className="lg-mode-check">✓</span>}
            </button>
            <button
              className={`lg-mode-dropdown-item ${inspectionMode === 'product' ? 'lg-mode-dropdown-active' : ''}`}
              onClick={switchToProductMode}
            >
              商品汇总
              {inspectionMode === 'product' && <span className="lg-mode-check">✓</span>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

export default Component;
