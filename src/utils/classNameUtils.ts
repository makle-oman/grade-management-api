/**
 * 班级名称格式化工具函数
 */

/**
 * 解析班级名称，提取年级和班级号
 * @param className 班级名称
 * @returns 包含年级和班级号的对象
 */
export function parseClassName(className: string): { grade: number; classNumber: number } {
  if (!className) return { grade: 1, classNumber: 1 };
  
  const trimmed = className.trim();
  
  // 支持多种格式的正则表达式
  const patterns = [
    /^(\d+)-(\d+)$/, // 1-2 格式
    /^\((\d+)\)\s*班$/, // (1) 班 格式
    /^([一二三四五六七八九十])（(\d+)）班$/, // 一（1）班 格式
    /^([一二三四五六七八九十])年级(\d+)班$/, // 一年级1班 格式
    /^(\d+)年级(\d+)班$/, // 1年级1班 格式
    /^(\d+)班$/, // 1班 格式
  ];

  const chineseNumbers: { [key: string]: number } = {
    '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6,
    '七': 7, '八': 8, '九': 9, '十': 10
  };

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match) {
      let grade: number;
      let classNumber: number;
      
      if (pattern.source === '^(\\d+)-(\\d+)$') {
        // 1-2 格式
        grade = parseInt(match[1]);
        classNumber = parseInt(match[2]);
      } else if (pattern.source === '^\\((\\d+)\\)\\s*班$') {
        // (1) 班 格式，默认为一年级
        grade = 1;
        classNumber = parseInt(match[1]);
      } else if (pattern.source === '^([一二三四五六七八九十])（(\\d+)）班$') {
        // 一（1）班 格式
        grade = chineseNumbers[match[1]] || 1;
        classNumber = parseInt(match[2]);
      } else if (pattern.source === '^([一二三四五六七八九十])年级(\\d+)班$') {
        // 一年级1班 格式
        grade = chineseNumbers[match[1]] || 1;
        classNumber = parseInt(match[2]);
      } else if (pattern.source === '^(\\d+)年级(\\d+)班$') {
        // 1年级1班 格式
        grade = parseInt(match[1]);
        classNumber = parseInt(match[2]);
      } else if (pattern.source === '^(\\d+)班$') {
        // 1班 格式，默认为一年级
        grade = 1;
        classNumber = parseInt(match[1]);
      }
      
      return { grade: grade || 1, classNumber: classNumber || 1 };
    }
  }

  // 默认返回
  return { grade: 1, classNumber: 1 };
}

/**
 * 格式化班级名称为存储格式 (年级-班级)
 * @param grade 年级
 * @param classNumber 班级号
 * @returns 格式化后的班级名称
 */
export function formatClassName(grade: number, classNumber: number): string {
  return `${grade}-${classNumber}`;
}

/**
 * 格式化班级名称为前端显示格式 一（班级）班
 * @param grade 年级
 * @param classNumber 班级号
 * @returns 前端显示格式的班级名称
 */
export function formatClassNameForDisplay(grade: number, classNumber: number): string {
  const gradeNames: { [key: number]: string } = {
    1: '一', 2: '二', 3: '三', 4: '四', 5: '五', 6: '六',
    7: '七', 8: '八', 9: '九', 10: '十'
  };
  
  const gradeName = gradeNames[grade] || `${grade}`;
  return `${gradeName}（${classNumber}）班`;
}

/**
 * 从前端显示格式转换为存储格式
 * @param displayName 前端显示的班级名称 (如: 一（1）班)
 * @returns 存储格式的班级名称 (如: 1-1)
 */
export function parseDisplayClassName(displayName: string): string {
  // 匹配 "一（1）班" 格式
  const match = displayName.match(/^([一二三四五六七八九十])（(\d+)）班$/);
  if (match) {
    const gradeName = match[1];
    const classNumber = parseInt(match[2]);
    
    const gradeMap: { [key: string]: number } = {
      '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6,
      '七': 7, '八': 8, '九': 9, '十': 10
    };
    
    const gradeNumber = gradeMap[gradeName] || 1;
    return `${gradeNumber}-${classNumber}`;
  }
  
  // 如果已经是存储格式，直接返回
  if (displayName.match(/^\d+-\d+$/)) {
    return displayName;
  }
  
  return displayName;
}

/**
 * 获取年级名称
 * @param grade 年级数字
 * @returns 年级名称
 */
export function getGradeName(grade: number): string {
  const gradeNames: { [key: number]: string } = {
    1: '一年级',
    2: '二年级', 
    3: '三年级',
    4: '四年级',
    5: '五年级',
    6: '六年级',
    7: '七年级',
    8: '八年级',
    9: '九年级'
  };
  
  return gradeNames[grade] || `${grade}年级`;
}

/**
 * 从班级名称中提取年级信息
 * @param className 班级名称
 * @returns 年级信息
 */
export function extractGradeFromClassName(className: string): string {
  const { grade } = parseClassName(className);
  return getGradeName(grade);
}

/**
 * 标准化班级名称格式，统一使用全角括号
 * @param className 原始班级名称
 * @returns 标准化后的班级名称
 */
export function normalizeClassName(className: string): string {
  if (!className) return '';
  
  const { grade, classNumber } = parseClassName(className);
  const gradeInChinese = getGradeName(grade).replace('年级', '');
  return `${gradeInChinese}（${classNumber}）班`;
}