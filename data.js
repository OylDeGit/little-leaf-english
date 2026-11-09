import {images} from './asset-bundle.js';
// Original bilingual vocabulary and example sentences. Illustration source: Twemoji.
const groups = [
['fruit','水果乐园','Fruit garden','每天认识一点甜甜的世界','#fff0e8','🍎',[
['apple','苹果','🍎','I have a red apple.'],['banana','香蕉','🍌','The banana is yellow.'],['watermelon','西瓜','🍉','I like watermelon.'],['strawberry','草莓','🍓','This strawberry is sweet.'],['grape','葡萄','🍇','I see a purple grape.'],['orange','橙子','🍊','This is an orange.'],['lemon','柠檬','🍋','The lemon is yellow.'],['pineapple','菠萝','🍍','This is a pineapple.'],['peach','桃子','🍑','I have a peach.'],['pear','梨','🍐','The pear is green.'],['cherry','樱桃','🍒','I see a red cherry.'],['kiwi','猕猴桃','🥝','I like kiwi fruit.']]],
['vegetables','蔬菜花园','Vegetable patch','发现餐桌上的小小能量','#edf5df','🥕',[
['tomato','西红柿','🍅','The tomato is red.'],['potato','土豆','🥔','This is a potato.'],['carrot','胡萝卜','🥕','The carrot is orange.'],['corn','玉米','🌽','I like corn.'],['onion','洋葱','🧅','This is an onion.'],['pumpkin','南瓜','🎃','The pumpkin is big.'],['mushroom','蘑菇','🍄','I see a mushroom.'],['cucumber','黄瓜','🥒','The cucumber is green.']]],
['farm','农场伙伴','On the farm','和可爱的动物们打个招呼','#fdf0d5','🐄',[
['cow','奶牛','🐄','The cow eats grass.'],['pig','猪','🐖','The pig is pink.'],['sheep','绵羊','🐑','The sheep is white.'],['horse','马','🐎','The horse can run.'],['chicken','鸡','🐔','This is a chicken.'],['duck','鸭子','🦆','The duck can swim.'],['dog','狗','🐕','The dog is happy.'],['cat','猫','🐈','The cat is sleeping.']]],
['wild','野生动物','Into the wild','一起去森林里探险','#e8f1e9','🦁',[
['tiger','老虎','🐅','The tiger has stripes.'],['elephant','大象','🐘','The elephant is big.'],['monkey','猴子','🐒','The monkey likes bananas.'],['giraffe','长颈鹿','🦒','The giraffe is tall.'],['lion','狮子','🦁','The lion is strong.'],['zebra','斑马','🦓','The zebra has stripes.'],['bear','熊','🐻','The bear is brown.'],['rabbit','兔子','🐇','The rabbit can jump.']]],
['food','美味食物','Yummy food','用英语分享你喜欢的美味','#fff0e8','🍞',[
['bread','面包','🍞','I eat bread.'],['cake','蛋糕','🍰','The cake is sweet.'],['chocolate','巧克力','🍫','I like chocolate.'],['sandwich','三明治','🥪','This is my sandwich.'],['pizza','披萨','🍕','I like pizza.'],['egg','鸡蛋','🥚','This is an egg.'],['rice','米饭','🍚','I eat rice.'],['cheese','奶酪','🧀','The cheese is yellow.']]],
['drinks','饮料小站','Take a sip','学习生活里的常用表达','#e7f2f8','🥛',[
['water','水','💧','I drink water.'],['milk','牛奶','🥛','The milk is white.'],['coffee','咖啡','☕','This is a cup of coffee.'],['tea','茶','🍵','The tea is hot.'],['juice','果汁','🧃','I like apple juice.'],['coconut','椰子','🥥','This is a coconut.']]],
['transport','出发旅行','On the move','下一站，去看看更大的世界','#eef0ff','🚂',[
['car','汽车','🚗','The car is red.'],['train','火车','🚂','The train is long.'],['airplane','飞机','✈️','The airplane can fly.'],['bus','公交车','🚌','I go by bus.'],['bicycle','自行车','🚲','I ride a bicycle.'],['boat','小船','⛵','The boat is on the water.'],['helicopter','直升机','🚁','The helicopter can fly.'],['rocket','火箭','🚀','The rocket goes up.']]],
['ocean','海洋奇遇','Under the sea','潜入蓝色世界，发现新朋友','#e2f3f4','🐳',[
['shark','鲨鱼','🦈','The shark can swim.'],['turtle','海龟','🐢','The turtle has a shell.'],['dolphin','海豚','🐬','The dolphin can jump.'],['crab','螃蟹','🦀','The crab has claws.'],['whale','鲸','🐋','The whale is big.'],['fish','鱼','🐟','The fish can swim.'],['octopus','章鱼','🐙','The octopus has eight arms.'],['shell','贝壳','🐚','I see a shell.']]],
['sports','运动时间','Let’s play','动一动，也学一学','#fff2d9','⚽',[
['basketball','篮球','🏀','I play basketball.'],['soccer','足球','⚽','I play soccer.'],['tennis','网球','🎾','I like tennis.'],['badminton','羽毛球','🏸','I play badminton.'],['baseball','棒球','⚾','I like baseball.'],['swimming','游泳','🏊','I like swimming.'],['skiing','滑雪','⛷️','I like skiing.'],['volleyball','排球','🏐','I play volleyball.']]],
['colors','缤纷颜色','A world of color','把世界装进彩色的单词里','#f2eafa','🎨',[
['red','红色','🔴','The apple is red.'],['green','绿色','🟢','The leaf is green.'],['blue','蓝色','🔵','The sky is blue.'],['yellow','黄色','🟡','The banana is yellow.'],['orange-color','橙色','🟠','The carrot is orange.','orange'],['purple','紫色','🟣','The grape is purple.'],['black','黑色','⚫','The cat is black.'],['white','白色','⚪','The sheep is white.']]],
['bugs','昆虫世界','Tiny wonders','小小身体，大大的奇妙','#eef4df','🦋',[
['butterfly','蝴蝶','🦋','The butterfly can fly.'],['bee','蜜蜂','🐝','The bee makes honey.'],['ant','蚂蚁','🐜','The ant is small.'],['ladybug','瓢虫','🐞','The ladybug is red.'],['cricket','蟋蟀','🦗','The cricket can jump.'],['beetle','甲虫','🪲','I see a beetle.']]],
['shapes','形状发现','Shape explorer','在身边找找这些有趣的形状','#f3ecf8','🔶',[
['circle','圆形','🔴','This is a circle.'],['triangle','三角形','🔺','This is a triangle.'],['square','正方形','🟦','This is a square.'],['rectangle','长方形','▰','This is a rectangle.'],['star','星形','⭐','This is a star.'],['heart','心形','❤️','This is a heart.'],['diamond','菱形','🔶','This is a diamond.'],['oval','椭圆形','⬭','This is an oval.']]]
];
export const categories=groups.map(([id,name,en,description,color,emoji,rows])=>({id,name,en,description,color,emoji,words:rows.map(([id,zh,emoji,sentence,word])=>({id,word:word||id,zh,emoji,sentence,category:groups.find(g=>g[6]===rows)[0]}))}));
export const words=categories.flatMap(c=>c.words);
export const wordMap=new Map(words.map(w=>[w.id,w]));
export function imagePath(w){return images[w.id];}
