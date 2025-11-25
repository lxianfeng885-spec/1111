
import { Entry } from './types';

export const APP_VERSION = '1.5.0';

// Initial Hierarchical Engineering Categories (User can edit these in the App)
export const INITIAL_CATEGORY_TREE: Record<string, string[]> = {
  '道路工程': ['上面层', '下面层', '基层', '底基层', '路床', '路肩'],
  '标牌': ['立杆', '基础', '标牌板面', '龙门架'],
  '休息区': ['油面', '厕所', '路灯', '停车场', '服务楼'],
  '人行道': ['路缘石', '透水砖', '盲道', '树池'],
  '护栏': ['波形护栏', '混凝土护栏', '防眩板'],
  '涵洞': ['圆管涵', '盖板涵', '箱涵', '洞口工程'],
  '桥梁': ['桩基', '墩柱', '盖梁', '梁板安装', '桥面铺装']
};

export const DIRECTIONS = [
  '左幅', 
  '右幅', 
  '全幅', 
  '中央分隔带',
  '互通匝道', 
  '连接线',
  'K0+000-K5+000',
  'K5+000-K10+000'
];

export const STATUS_OPTIONS = ['待处理', '已完成', '审核中', '紧急'];

export const INITIAL_ENTRIES: Entry[] = [
  {
    id: 'init-1',
    date: new Date().toISOString().split('T')[0],
    category: '道路工程',
    subCategory: '上面层',
    location: '左幅 K2+300-K2+800',
    description: '沥青摊铺施工',
    amount: 500,
    status: '已完成',
    notes: '温度符合要求，压实度合格',
    resources: [
      { type: '人员', name: '摊铺工', count: 12, unit: '人' },
      { type: '机械', name: '摊铺机', count: 2, unit: '台' }
    ],
    photos: []
  },
  {
    id: 'init-2',
    date: new Date().toISOString().split('T')[0],
    category: '标牌',
    subCategory: '基础',
    location: '右幅 K5+100',
    description: '单柱式标志基础浇筑',
    amount: 2,
    status: '审核中',
    notes: '等待混凝土强度报告',
    resources: [],
    photos: []
  }
];
