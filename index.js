// file_migration.js
const fs = require('fs');
const path = require('path');

// Configure source and target directories
const sourceDir = '/Applications/scar_file/scar-project/blog/source';
const targetDir = '/Applications/scar_file/scar-project/scar-blog/data/blog';

// Read directory contents
function migrateFiles() {
    fs.readdir(sourceDir, (err, files) => {
        if (err) {
            return;
        }

        files.forEach(file => {
            const filePath = path.join(sourceDir, file);
            const targetPath = path.join(targetDir, file);

            // Check if it is a file
            fs.stat(filePath, (err, stats) => {
                if (err){
                    return;
                }

                if (stats.isDirectory()) { // Only process directories
                     // Check directory name
                     if (file.includes('_posts')) {
                        migratePost(filePath, targetPath); // Migrate _posts directory
                    } else  if (file.includes('_drafts')) {
                        migrateDraft(filePath, targetPath); // Migrate _drafts directory
                    }
                }
            });
        });
    });
}

// Migrate source_post files
function migratePost(sourcePath, targetPath) {
    function processDirectory(currentPath, targetPath) {
        fs.readdir(currentPath, (err, items) => {
            if (err) {
                console.error(`Error reading directory ${currentPath}:`, err);
                return;
            }

            items.forEach(item => {
                const itemPath = path.join(currentPath, item);
                const itemTargetPath = path.join(targetPath.replace('_posts',''), item);
                fs.stat(itemPath, (err, stats) => {
                    if (err) {
                        console.error(`Error getting status of ${itemPath}:`, err);
                        return;
                    }

                    if (stats.isDirectory()) {
                        // If it is a directory, process recursively
                        fs.mkdir(itemTargetPath, { recursive: true }, (err) => {
                            if (err) {
                                console.error(`Error creating directory ${itemTargetPath}:`, err);
                                return;
                            }
                            processDirectory(itemPath, itemTargetPath);
                        });
                    } else if (stats.isFile()) {
                        // If it is a file and the file is md, process file content
                        if (path.extname(itemPath).toLowerCase() === '.md') {
                            fs.readFile(itemPath, 'utf8', (err, data) => {
                                if (err) {
                                    console.error(`Error reading file ${itemPath}:`, err);
                                    return;
                                }
                                const newContent = convertContent(data);
                                const newPath = itemTargetPath.replace('.md', '.mdx');
                                fs.writeFile(newPath, newContent, err => {
                                    if (err) {
                                        console.error(`Error writing file ${newPath}:`, err);
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

// Migrate _draft files
function migrateDraft(sourcePath, targetPath) {
    fs.readdir(sourcePath, (err, files) => {
        if (err) throw err;

        files.forEach(file => {
            const filePath = path.join(sourcePath, file);
            // Read file content
            fs.readFile(filePath, 'utf8', (err, data) => {
                if (err) {
                    console.log(filePath)
                   return;
                }
                const newContent = convertContent(data,{
                    isDraft:true
                }); // Convert content
                const categories = extractCategories(data);
                categories.forEach(category => {
                    const categoryPath = path.join(targetDir, category);
                    fs.mkdirSync(categoryPath, { recursive: true }); // Create category directory
                    fs.writeFile(path.join(categoryPath, file), newContent, err => {
                        if (err) throw err;
                    });
                });
            });
        });
    });
}

// Convert content
function convertContent(data,opts={}) {
    const title = extractTitle(data);
    const date = extractDate(data);
    const tags = extractCategories(data);
    const summary = extractSummary(data); // Extract summary
    const content = extractContent(data); // Extract content
    // Convert date format to 'YYYY-MM-DD'
    const formattedDate = date.replace(/(\d{4})\/(\d{2})\/(\d{2})/, '$1-$2-$3');

    return `---
title: ${title}
date: '${formattedDate}'
tags: ${JSON.stringify(tags)}
draft: ${opts.isDraft?"true":"false"}
summary: ${summary}
---
${content}
`;
}

// Extract summary
function extractSummary(data) {
    const match = data.match(/^description:*(.*)$/m);
    return match ? match[1] : '';
}

// Extract content
function extractContent(data) {
    const contentMatch = data.match(/---\r?\n[\s\S]*?\r?\n---\r?\n([\s\S]*)/);
    return contentMatch ? contentMatch[1].trim() : ''; // Extract content after the second ---
}

// Extract title
function extractTitle(data) {
    const match = data.match(/title:\s*(.+)$/m);
    return match ? match[1].trim() : '';
}

// Extract date
function extractDate(data) {
    const match = data.match(/date:\s*(.+)$/m);
    return match ? match[1].trim().replace(/\//g, '-') : '';
}

// Extract categories
function extractCategories(text) {
    // Define a regular expression to match the categories section
    const pattern = /categories:\s*(?:-\s*\[(.*?)\]|(.*?))\s*---/s;
    const match = text.match(pattern);
    
    if (match) {
        let categories;
        // If the match is in array format
        if (match[1]) {
            categories = match[1].split(',').map(cat => cat.trim());
        } 
        // If the match is a single value
        else {
            categories = [match[2].trim()];
        }
        return categories;
    }
    return [];
}

// Start migration
migrateFiles();