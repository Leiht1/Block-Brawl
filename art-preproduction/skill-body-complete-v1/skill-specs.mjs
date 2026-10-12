export const SPECS={
 fire:{name:'火焰冲击',type:'attack',mainMs:720,duration:3200,design:'沿用v3红橙火舌和暖金前缘，3格范围清楚、收尾干净。',rule:'敌方横向最多3格，提交后2.2秒结算。'},
 quake:{name:'裂地横扫',type:'attack',mainMs:720,duration:2300,design:'已选择横排方案：低矮岩脊从左到右扫过指定行，碎岩与裂隙局限于有效格。',rule:'用户已选：破坏指定目标行全部有效普通方块，最多8格；尚未接入正式游戏。'},
 meteor:{name:'陨石坠落',type:'attack',mainMs:800,duration:3000,design:'赤褐陨石与短橙金尾迹沿真实目标列下落；落点碎岩局限于命中格。',rule:'1.6秒后结算，路径最多命中5格及底部两侧；服从障碍截断。'},
 bomb:{name:'炸弹投放',type:'attack',mainMs:760,duration:3000,design:'小铜壳炸弹落地，短引信提示后低矮爆裂；3×3区域边界清楚。',rule:'提交后1.8秒清除落点周围3×3有效格。'},
 freeze:{name:'时间冻结',type:'control',mainMs:760,duration:3900,design:'沿用v3冰蓝冰壳、晶角与霜裂，留空中心保证方块可读。',rule:'冻结敌方3秒，暂停新交换；原动作继续。'},
 blackhole:{name:'黑洞吸引',type:'control',mainMs:760,duration:2200,design:'沿用v3小蓝紫吸引核；牵引轨迹跟随真实6块的控制点曲线。',rule:'附近6个普通方块轮转420ms；即时生效。'},
 storm:{name:'混乱风暴',type:'control',mainMs:800,duration:2400,design:'蓝灰斜向风旋和短乱流带；在真实变色的6格出现局部涡纹，保留方块身份。',rule:'即时随机改变敌方6个普通块颜色，不移动它们。'},
 fog:{name:'迷雾领域',type:'control',mainMs:800,duration:7600,design:'命中原地展开一团连续的大雾，厚实中心遮挡视线，6秒期限结束后用1.2秒缓慢散开。',rule:'审核场景拟定落点附近连续12个普通格受雾影响6秒；正式游戏仍是随机12格，未接入。'},
 overload:{name:'超载模式',type:'buff',mainMs:760,duration:10900,design:'青金晶体短暂充能后消散；持续状态只保留左侧大晶体图标、×2和倒计时，不覆盖棋盘光效。',rule:'己方10秒消除得分翻倍；预览按真实消除事件显示得分。'},
 sage:{name:'贤者时间',type:'buff',mainMs:800,duration:6000,design:'保留整盘金色蒙层，新增方块后方的暖金底光，缓慢上涌并从格间透出；可切换仅蒙层版比较。',rule:'己方5秒自动寻找最佳消除，间隔650ms；展示原引擎交换。'},
 rainbow:{name:'彩虹核心',type:'buff',mainMs:800,duration:2600,design:'彩色棱面核心聚成圆润万能块，星心明确；落点跟随实际随机生成格。',rule:'随机生成1个万能块，交换相邻块可清同色；不伪造指定落点。'},
 luck:{name:'幸运星',type:'buff',mainMs:800,duration:10900,design:'亮金棱面星光与蜜金星轨短暂展开后消散；持续状态只保留左侧大金星图标和倒计时，不覆盖棋盘光效、不生成万能块。',rule:'恢复原效果：己方10秒内补充方块有22%概率变为特殊方块。'}
};
export const IDS=Object.keys(SPECS);
export const IMMEDIATE=['quake','blackhole','storm','rainbow'];
