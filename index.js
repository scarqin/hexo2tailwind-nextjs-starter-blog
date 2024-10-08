// file_migration.js
const fs = require('fs');
const path = require('path');

// 配置源和目标目录
const sourceDir = '/Applications/scar_file/scar-project/blog/source';
const targetDir = '/Applications/scar_file/scar-project/scar-blog/data/blog';

// 读取目录内容
function migrateFiles() {
    fs.readdir(sourceDir, (err, files) => {
        if (err) {
            return;
        }

        files.forEach(file => {
            const filePath = path.join(sourceDir, file);
            const targetPath = path.join(targetDir, file);

            // 检查是否为文件
            fs.stat(filePath, (err, stats) => {
                if (err){
                    return;
                }

                if (stats.isDirectory()) { // 只处理目录
                     // 检查目录名
                     if (file.includes('_posts')) {
                        migratePost(filePath, targetPath); // 迁移 _posts 目录
                    } else  if (file.includes('_drafts')) {
                        // migrateDraft(filePath, targetPath); // 迁移 _drafts 目录
                    }
                }
            });
        });
    });
}

// 迁移 source_post 文件
function migratePost(sourcePath, targetPath) {
    function processDirectory(currentPath, targetPath) {
        fs.readdir(currentPath, (err, items) => {
            if (err) {
                console.error(`读取目录 ${currentPath} 时出错:`, err);
                return;
            }

            items.forEach(item => {
                const itemPath = path.join(currentPath, item);
                const itemTargetPath = path.join(targetPath, item);

                fs.stat(itemPath, (err, stats) => {
                    if (err) {
                        console.error(`获取 ${itemPath} 状态时出错:`, err);
                        return;
                    }

                    if (stats.isDirectory()) {
                        // 如果是目录，递归处理
                        fs.mkdir(itemTargetPath, { recursive: true }, (err) => {
                            if (err) {
                                console.error(`创建目录 ${itemTargetPath} 时出错:`, err);
                                return;
                            }
                            processDirectory(itemPath, itemTargetPath);
                        });
                    } else if (stats.isFile()) {
                        // 如果是文件且文件 md，处理文件内容
                        if (path.extname(itemPath).toLowerCase() === '.md') {
                            fs.readFile(itemPath, 'utf8', (err, data) => {
                                if (err) {
                                    console.error(`读取文件 ${itemPath} 时出错:`, err);
                                    return;
                                }
                                const newContent = convertContent(data);
                                const newPath = itemTargetPath.replace('.md', '.mdx');
                                fs.writeFile(newPath, newContent, err => {
                                    if (err) {
                                        console.error(`写入文件 ${newPath} 时出错:`, err);
                                    }
                                });
                            });
                        } 
                    }
                });
            });
        });
    }

    processDirectory(sourcePath, targetPath);
}

// 迁移 _draft 文件
function migrateDraft(sourcePath, targetPath) {
    fs.readdir(sourcePath, (err, files) => {
        if (err) throw err;

        files.forEach(file => {
            const filePath = path.join(sourcePath, file);
            // 读取文件内容
            fs.readFile(filePath, 'utf8', (err, data) => {
                if (err) {
                    console.log(filePath)
                   return;
                }
                const categories = extractCategories(data);
                const newContent = convertContent(data, categories); // 转换内容
                categories.forEach(category => {
                    const categoryPath = path.join(targetDir, category);
                    fs.mkdirSync(categoryPath, { recursive: true }); // 创建分类目录
                    fs.writeFile(path.join(categoryPath, file), newContent, err => {
                        if (err) throw err;
                    });
                });
            });
        });
    });
}

// 转换内容
function convertContent(data, categories = []) {
    const title = extractTitle(data);
    const date = extractDate(data);
    const summary = extractSummary(data); // 提取摘要
    const content = extractContent(data); // 提取内容

    // 将日期格式转换为 'YYYY-MM-DD'
    const formattedDate = date.replace(/(\d{4})\/(\d{2})\/(\d{2})/, '$1-$2-$3');

    return `---
title: ${title}
date: '${formattedDate}'
tags: ${JSON.stringify(categories)}
draft: false
summary: ${summary}
---
${content}
`;
}

// 提取摘要
function extractSummary(data) {
    const match = data.match(/description:\s*(.+)/);
    return match ? match[1].trim() : '\n';
}

// 提取内容
function extractContent(data) {
    const match = data.match(/---\n([\s\S]*?)\n---/);
    return match ? data.split('---').slice(2).join('---').trim() : ''; // 提取内容部分
}

// 提取标题
function extractTitle(data) {
    const match = data.match(/title:\s*(.+)/);
    return match ? match[1].trim() : '无标题';
}

// 提取日期
function extractDate(data) {
    const match = data.match(/date:\s*(.+)/);
    return match ? match[1].trim().replace(/\//g, '-') : '无日期';
}

// 提取分类
function extractCategories(data) {
    const match = data.match(/categories:\s*\n\s*-\s*\[(.+)\]/);
    return match ? match[1].split(',').map(cat => cat.trim()) : [];
}

// 开始迁移
migrateFiles();