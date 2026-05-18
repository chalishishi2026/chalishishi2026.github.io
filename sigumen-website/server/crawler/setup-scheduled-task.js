/**
 * Windows任务计划程序配置脚本
 * 运行此脚本会在Windows中添加定时任务
 */

const { execSync } = require('child_process');
const path = require('path');

const CONFIG = {
  // 抓取脚本路径
  CRAWLER_PATH: path.join(__dirname, 'news-crawler.js'),
  // 任务名称
  TASK_NAME: 'SigumenNewsCrawler',
  // 执行频率：每天早上8点
  SCHEDULE_TIME: '08:00',
  // 执行频率：每天
  SCHEDULE_DAY: 'DAILY'
};

function createScheduledTask() {
  console.log('\n========================================');
  console.log('肆顾门资讯抓取 - Windows定时任务配置');
  console.log('========================================\n');

  try {
    // 检查node路径
    const nodePath = process.execPath;
    console.log(`Node路径: ${nodePath}`);

    // 删除旧任务（如果存在）
    try {
      execSync(`schtasks /delete /tn "${CONFIG.TASK_NAME}" /f`, { stdio: 'ignore' });
      console.log('[提示] 已删除旧任务配置');
    } catch (e) {
      // 任务不存在，忽略
    }

    // 创建新任务
    // 语法: schtasks /create /tn 任务名 /tr 执行命令 /sc 频率 /st 时间
    const command = `schtasks /create /tn "${CONFIG.TASK_NAME}" /tr "node \\"${CONFIG.CRAWLER_PATH}\\" --once" /sc ${CONFIG.SCHEDULE_DAY} /st ${CONFIG.SCHEDULE_TIME} /f`;

    console.log(`\n正在创建定时任务...`);
    console.log(`任务名称: ${CONFIG.TASK_NAME}`);
    console.log(`执行频率: 每天 ${CONFIG.SCHEDULE_TIME}`);
    console.log(`执行命令: node "${CONFIG.CRAWLER_PATH}" --once\n`);

    execSync(command, { stdio: 'inherit' });

    console.log('\n✅ 定时任务创建成功！\n');
    console.log('----------------------------------------');
    console.log('任务信息：');
    console.log(`  名称: ${CONFIG.TASK_NAME}`);
    console.log(`  频率: 每天 ${CONFIG.SCHEDULE_TIME}`);
    console.log(`  命令: 抓取最新资讯并添加到数据库`);
    console.log('----------------------------------------\n');
    console.log('提示：');
    console.log('  - 打开"任务计划程序"可查看和管理任务');
    console.log('  - 可以手动运行任务测试');
    console.log('  - 如需删除，运行: schtasks /delete /tn "' + CONFIG.TASK_NAME + '" /f\n');

  } catch (error) {
    console.error('\n❌ 创建定时任务失败:', error.message);
    console.log('\n请尝试以管理员身份运行此脚本。\n');
  }
}

function deleteScheduledTask() {
  try {
    execSync(`schtasks /delete /tn "${CONFIG.TASK_NAME}" /f`, { stdio: 'inherit' });
    console.log('✅ 定时任务已删除');
  } catch (error) {
    console.log('任务不存在或删除失败');
  }
}

// 命令行参数
const args = process.argv.slice(2);
if (args[0] === '--delete') {
  deleteScheduledTask();
} else if (args[0] === '--check') {
  try {
    const result = execSync(`schtasks /query /tn "${CONFIG.TASK_NAME}" 2>nul`, { encoding: 'utf-8' });
    console.log('定时任务状态:\n');
    console.log(result);
  } catch (error) {
    console.log('定时任务未配置');
  }
} else {
  createScheduledTask();
}
