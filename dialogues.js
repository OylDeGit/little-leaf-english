// Original beginner dialogues. Prices are illustrative teaching examples.
export const dialogues = [
  {
    id: 'fruit-shop',
    group: '购物',
    title: '买水果',
    emoji: '🍎',
    lines: [
      {
        role: '店员',
        en: 'Hello! What would you like?',
        zh: '你好！你想买什么？',
        audio: 'assets/audio/dialogue-fruit-shop-0.m4a',
      },
      {
        role: '顾客',
        en: 'Two apples, please.',
        zh: '请给我两个苹果。',
        audio: 'assets/audio/dialogue-fruit-shop-1.m4a',
        options: [
          {
            en: 'Two apples, please.',
            zh: '请给我两个苹果。',
          },
          {
            en: 'I am ten years old.',
            zh: '我十岁了。',
          },
          {
            en: 'It is sunny today.',
            zh: '今天天气晴朗。',
          },
        ],
      },
      {
        role: '店员',
        en: 'Would you like anything else?',
        zh: '你还要别的吗？',
        audio: 'assets/audio/dialogue-fruit-shop-2.m4a',
      },
      {
        role: '顾客',
        en: 'A banana, please.',
        zh: '请再给我一根香蕉。',
        audio: 'assets/audio/dialogue-fruit-shop-3.m4a',
        options: [
          {
            en: 'A banana, please.',
            zh: '请再给我一根香蕉。',
          },
          {
            en: 'My name is Tom.',
            zh: '我叫汤姆。',
          },
          {
            en: 'I can swim.',
            zh: '我会游泳。',
          },
        ],
      },
      {
        role: '店员',
        en: 'Here you are.',
        zh: '给你。',
        audio: 'assets/audio/dialogue-fruit-shop-4.m4a',
      },
      {
        role: '顾客',
        en: 'Thank you!',
        zh: '谢谢！',
        audio: 'assets/audio/dialogue-fruit-shop-5.m4a',
        options: [
          {
            en: 'Thank you!',
            zh: '谢谢！',
          },
          {
            en: 'Where is my school?',
            zh: '我的学校在哪里？',
          },
          {
            en: 'I have a blue coat.',
            zh: '我有一件蓝色外套。',
          },
        ],
      },
    ],
  },
  {
    id: 'clothes-shop',
    group: '购物',
    title: '挑选衣服',
    emoji: '👕',
    lines: [
      {
        role: '店员',
        en: 'Can I help you?',
        zh: '有什么可以帮你的吗？',
        audio: 'assets/audio/dialogue-clothes-shop-0.m4a',
      },
      {
        role: '顾客',
        en: 'I would like a T-shirt.',
        zh: '我想买一件T恤。',
        audio: 'assets/audio/dialogue-clothes-shop-1.m4a',
        options: [
          {
            en: 'I would like a T-shirt.',
            zh: '我想买一件T恤。',
          },
          {
            en: 'I like to read.',
            zh: '我喜欢阅读。',
          },
          {
            en: 'It is a banana.',
            zh: '这是一根香蕉。',
          },
        ],
      },
      {
        role: '店员',
        en: 'What color would you like?',
        zh: '你想要什么颜色？',
        audio: 'assets/audio/dialogue-clothes-shop-2.m4a',
      },
      {
        role: '顾客',
        en: 'Blue, please.',
        zh: '蓝色，谢谢。',
        audio: 'assets/audio/dialogue-clothes-shop-3.m4a',
        options: [
          {
            en: 'Blue, please.',
            zh: '蓝色，谢谢。',
          },
          {
            en: 'Two apples, please.',
            zh: '请给我两个苹果。',
          },
          {
            en: 'I am hungry.',
            zh: '我饿了。',
          },
        ],
      },
      {
        role: '店员',
        en: 'What size do you need?',
        zh: '你需要什么尺码？',
        audio: 'assets/audio/dialogue-clothes-shop-4.m4a',
      },
      {
        role: '顾客',
        en: 'A small, please.',
        zh: '小号，谢谢。',
        audio: 'assets/audio/dialogue-clothes-shop-5.m4a',
        options: [
          {
            en: 'A small, please.',
            zh: '小号，谢谢。',
          },
          {
            en: 'It is Monday.',
            zh: '今天是星期一。',
          },
          {
            en: 'I live near the park.',
            zh: '我住在公园附近。',
          },
        ],
      },
    ],
  },
  {
    id: 'price-shop',
    group: '购物',
    title: '询问价格',
    emoji: '🏷️',
    lines: [
      {
        role: '店员',
        en: 'Do you like this bag?',
        zh: '你喜欢这个包吗？',
        audio: 'assets/audio/dialogue-price-shop-0.m4a',
      },
      {
        role: '顾客',
        en: 'Yes. How much is it?',
        zh: '喜欢。它多少钱？',
        audio: 'assets/audio/dialogue-price-shop-1.m4a',
        options: [
          {
            en: 'Yes. How much is it?',
            zh: '喜欢。它多少钱？',
          },
          {
            en: 'My cat is small.',
            zh: '我的猫很小。',
          },
          {
            en: 'It is raining.',
            zh: '正在下雨。',
          },
        ],
      },
      {
        role: '店员',
        en: 'It is ten dollars.',
        zh: '十美元。',
        audio: 'assets/audio/dialogue-price-shop-2.m4a',
      },
      {
        role: '顾客',
        en: 'Can I pay by card?',
        zh: '我可以刷卡吗？',
        audio: 'assets/audio/dialogue-price-shop-3.m4a',
        options: [
          {
            en: 'Can I pay by card?',
            zh: '我可以刷卡吗？',
          },
          {
            en: 'My teacher is kind.',
            zh: '我的老师很亲切。',
          },
          {
            en: 'The apple is red.',
            zh: '苹果是红色的。',
          },
        ],
      },
      {
        role: '店员',
        en: 'Yes, you can.',
        zh: '可以。',
        audio: 'assets/audio/dialogue-price-shop-4.m4a',
      },
      {
        role: '顾客',
        en: 'Great. I will take it.',
        zh: '太好了，我买了。',
        audio: 'assets/audio/dialogue-price-shop-5.m4a',
        options: [
          {
            en: 'Great. I will take it.',
            zh: '太好了，我买了。',
          },
          {
            en: 'I can see a bird.',
            zh: '我看见一只鸟。',
          },
          {
            en: 'I go to school by bus.',
            zh: '我乘公交车上学。',
          },
        ],
      },
    ],
  },
  {
    id: 'checkout-shop',
    group: '购物',
    title: '结账与购物袋',
    emoji: '🛍️',
    lines: [
      {
        role: '收银员',
        en: 'Are you ready to pay?',
        zh: '你准备结账了吗？',
        audio: 'assets/audio/dialogue-checkout-shop-0.m4a',
      },
      {
        role: '顾客',
        en: 'Yes, please.',
        zh: '是的，谢谢。',
        audio: 'assets/audio/dialogue-checkout-shop-1.m4a',
        options: [
          {
            en: 'Yes, please.',
            zh: '是的，谢谢。',
          },
          {
            en: 'My birthday is in May.',
            zh: '我的生日在五月。',
          },
          {
            en: 'The dog is sleeping.',
            zh: '狗正在睡觉。',
          },
        ],
      },
      {
        role: '收银员',
        en: 'Would you like a bag?',
        zh: '你需要购物袋吗？',
        audio: 'assets/audio/dialogue-checkout-shop-2.m4a',
      },
      {
        role: '顾客',
        en: 'Yes, one bag, please.',
        zh: '需要，请给我一个袋子。',
        audio: 'assets/audio/dialogue-checkout-shop-3.m4a',
        options: [
          {
            en: 'Yes, one bag, please.',
            zh: '需要，请给我一个袋子。',
          },
          {
            en: 'I play the piano.',
            zh: '我弹钢琴。',
          },
          {
            en: 'It is cold outside.',
            zh: '外面很冷。',
          },
        ],
      },
      {
        role: '收银员',
        en: 'Here is your receipt.',
        zh: '这是你的收据。',
        audio: 'assets/audio/dialogue-checkout-shop-4.m4a',
      },
      {
        role: '顾客',
        en: 'Thank you. Have a nice day!',
        zh: '谢谢，祝你今天愉快！',
        audio: 'assets/audio/dialogue-checkout-shop-5.m4a',
        options: [
          {
            en: 'Thank you. Have a nice day!',
            zh: '谢谢，祝你今天愉快！',
          },
          {
            en: 'I have two sisters.',
            zh: '我有两个姐姐或妹妹。',
          },
          {
            en: 'The ball is under the chair.',
            zh: '球在椅子下面。',
          },
        ],
      },
    ],
  },
  {
    id: 'meal-order',
    group: '点餐',
    title: '点一份午餐',
    emoji: '🍽️',
    lines: [
      {
        role: '服务员',
        en: 'What would you like to eat?',
        zh: '你想吃什么？',
        audio: 'assets/audio/dialogue-meal-order-0.m4a',
      },
      {
        role: '顾客',
        en: 'A sandwich, please.',
        zh: '请给我一份三明治。',
        audio: 'assets/audio/dialogue-meal-order-1.m4a',
        options: [
          {
            en: 'A sandwich, please.',
            zh: '请给我一份三明治。',
          },
          {
            en: 'My shoes are brown.',
            zh: '我的鞋子是棕色的。',
          },
          {
            en: 'I have a pencil.',
            zh: '我有一支铅笔。',
          },
        ],
      },
      {
        role: '服务员',
        en: 'Would you like some soup?',
        zh: '你想要一些汤吗？',
        audio: 'assets/audio/dialogue-meal-order-2.m4a',
      },
      {
        role: '顾客',
        en: 'Yes, please.',
        zh: '好的，谢谢。',
        audio: 'assets/audio/dialogue-meal-order-3.m4a',
        options: [
          {
            en: 'Yes, please.',
            zh: '好的，谢谢。',
          },
          {
            en: 'My bag is heavy.',
            zh: '我的包很重。',
          },
          {
            en: 'It is a red car.',
            zh: '这是一辆红色汽车。',
          },
        ],
      },
      {
        role: '服务员',
        en: 'Is that everything?',
        zh: '就这些吗？',
        audio: 'assets/audio/dialogue-meal-order-4.m4a',
      },
      {
        role: '顾客',
        en: 'Yes, thank you.',
        zh: '是的，谢谢。',
        audio: 'assets/audio/dialogue-meal-order-5.m4a',
        options: [
          {
            en: 'Yes, thank you.',
            zh: '是的，谢谢。',
          },
          {
            en: 'I can ride a bicycle.',
            zh: '我会骑自行车。',
          },
          {
            en: 'My brother is tall.',
            zh: '我哥哥或弟弟很高。',
          },
        ],
      },
    ],
  },
  {
    id: 'drink-order',
    group: '点餐',
    title: '点一杯饮料',
    emoji: '🥤',
    lines: [
      {
        role: '店员',
        en: 'What would you like to drink?',
        zh: '你想喝什么？',
        audio: 'assets/audio/dialogue-drink-order-0.m4a',
      },
      {
        role: '顾客',
        en: 'Orange juice, please.',
        zh: '橙汁，谢谢。',
        audio: 'assets/audio/dialogue-drink-order-1.m4a',
        options: [
          {
            en: 'Orange juice, please.',
            zh: '橙汁，谢谢。',
          },
          {
            en: 'I need new shoes.',
            zh: '我需要新鞋子。',
          },
          {
            en: 'This is my notebook.',
            zh: '这是我的笔记本。',
          },
        ],
      },
      {
        role: '店员',
        en: 'Small or large?',
        zh: '小杯还是大杯？',
        audio: 'assets/audio/dialogue-drink-order-2.m4a',
      },
      {
        role: '顾客',
        en: 'A small one, please.',
        zh: '请给我小杯。',
        audio: 'assets/audio/dialogue-drink-order-3.m4a',
        options: [
          {
            en: 'A small one, please.',
            zh: '请给我小杯。',
          },
          {
            en: 'I am at school.',
            zh: '我在学校。',
          },
          {
            en: 'The flower is yellow.',
            zh: '花是黄色的。',
          },
        ],
      },
      {
        role: '店员',
        en: 'Would you like ice?',
        zh: '你需要加冰吗？',
        audio: 'assets/audio/dialogue-drink-order-4.m4a',
      },
      {
        role: '顾客',
        en: 'No ice, please.',
        zh: '请不要加冰。',
        audio: 'assets/audio/dialogue-drink-order-5.m4a',
        options: [
          {
            en: 'No ice, please.',
            zh: '请不要加冰。',
          },
          {
            en: 'I like my teacher.',
            zh: '我喜欢我的老师。',
          },
          {
            en: 'It is a long train.',
            zh: '这是一列长火车。',
          },
        ],
      },
    ],
  },
  {
    id: 'takeaway-order',
    group: '点餐',
    title: '外带食物',
    emoji: '🥡',
    lines: [
      {
        role: '店员',
        en: 'What can I get for you?',
        zh: '你想要些什么？',
        audio: 'assets/audio/dialogue-takeaway-order-0.m4a',
      },
      {
        role: '顾客',
        en: 'A hamburger, please.',
        zh: '请给我一个汉堡包。',
        audio: 'assets/audio/dialogue-takeaway-order-1.m4a',
        options: [
          {
            en: 'A hamburger, please.',
            zh: '请给我一个汉堡包。',
          },
          {
            en: 'I have a new toy.',
            zh: '我有一个新玩具。',
          },
          {
            en: 'The sky is blue.',
            zh: '天空是蓝色的。',
          },
        ],
      },
      {
        role: '店员',
        en: 'Would you like fries with that?',
        zh: '你想搭配薯条吗？',
        audio: 'assets/audio/dialogue-takeaway-order-2.m4a',
      },
      {
        role: '顾客',
        en: 'Yes, please.',
        zh: '好的，谢谢。',
        audio: 'assets/audio/dialogue-takeaway-order-3.m4a',
        options: [
          {
            en: 'Yes, please.',
            zh: '好的，谢谢。',
          },
          {
            en: 'I like this song.',
            zh: '我喜欢这首歌。',
          },
          {
            en: 'My ruler is short.',
            zh: '我的尺子很短。',
          },
        ],
      },
      {
        role: '店员',
        en: 'For here or to go?',
        zh: '在这里吃还是带走？',
        audio: 'assets/audio/dialogue-takeaway-order-4.m4a',
      },
      {
        role: '顾客',
        en: 'To go, please.',
        zh: '请打包带走。',
        audio: 'assets/audio/dialogue-takeaway-order-5.m4a',
        options: [
          {
            en: 'To go, please.',
            zh: '请打包带走。',
          },
          {
            en: 'It is my birthday.',
            zh: '今天是我的生日。',
          },
          {
            en: 'The cat is white.',
            zh: '猫是白色的。',
          },
        ],
      },
    ],
  },
  {
    id: 'bill-order',
    group: '点餐',
    title: '餐后结账',
    emoji: '🧾',
    lines: [
      {
        role: '服务员',
        en: 'Did you enjoy your meal?',
        zh: '你这顿饭吃得满意吗？',
        audio: 'assets/audio/dialogue-bill-order-0.m4a',
      },
      {
        role: '顾客',
        en: 'Yes, it was delicious.',
        zh: '满意，非常好吃。',
        audio: 'assets/audio/dialogue-bill-order-1.m4a',
        options: [
          {
            en: 'Yes, it was delicious.',
            zh: '满意，非常好吃。',
          },
          {
            en: 'I have a blue pen.',
            zh: '我有一支蓝色笔。',
          },
          {
            en: 'My bike is outside.',
            zh: '我的自行车在外面。',
          },
        ],
      },
      {
        role: '服务员',
        en: 'Would you like anything else?',
        zh: '你还需要别的吗？',
        audio: 'assets/audio/dialogue-bill-order-2.m4a',
      },
      {
        role: '顾客',
        en: 'Just the bill, please.',
        zh: '请结账就好。',
        audio: 'assets/audio/dialogue-bill-order-3.m4a',
        options: [
          {
            en: 'Just the bill, please.',
            zh: '请结账就好。',
          },
          {
            en: 'The mountain is high.',
            zh: '山很高。',
          },
          {
            en: 'I can count to twenty.',
            zh: '我能数到二十。',
          },
        ],
      },
      {
        role: '服务员',
        en: 'How would you like to pay?',
        zh: '你想用什么方式付款？',
        audio: 'assets/audio/dialogue-bill-order-4.m4a',
      },
      {
        role: '顾客',
        en: 'By card, please.',
        zh: '刷卡，谢谢。',
        audio: 'assets/audio/dialogue-bill-order-5.m4a',
        options: [
          {
            en: 'By card, please.',
            zh: '刷卡，谢谢。',
          },
          {
            en: 'I like butterflies.',
            zh: '我喜欢蝴蝶。',
          },
          {
            en: 'This is my school.',
            zh: '这是我的学校。',
          },
        ],
      },
    ],
  },
];
