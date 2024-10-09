
# 需求
1. 文件目录迁移
提供两个配置本机文件地址，将旧文件转换后复制到新的文件地址
1. source _post 文件夹下面的文件内容直接迁移
2. _draft 文件夹里面的内容根据 categories 分类到相应的目录
3. 迁移的时候，所有内容都需要进行原数据转换
```
---
title: Real Cat
date: 2024/09/08 23:56
description:
categories:
  - [产品]
---
```
转换为下面内容：
1. date 转换为日期
```
---
title: Sample .md file
date: '2016-03-08'
tags: ['markdown', 'code', 'features']
draft: false
summary: Example of a markdown file with code blocks and syntax highlighting
---
```

