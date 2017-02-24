/*:
 * @help
 * Databaseの開発用プラグインです。配布時にはOffにしてください。
 * エラーが発生します。
 *
 * licensed under MIT
 *
 */


let error;

if(!location.search.slice(1).split('&').contains('test')){
    error = {
        name: 'liply_Database_Development',
        message: 'You are running in Production mode. Turn off liply_Database_Development!!!!!!!'
    };
}


const Graphics_initialize = Graphics.initialize;
Graphics.initialize = function(){
    Graphics_initialize.apply(this, arguments);

    if(error){
        Graphics.printError(error.name, error.message);
    }
};


let alasql = require('alasql');
let fs = require('fs');
let path = require('path');

let current = path.dirname(process.mainModule.filename);

function replaceSpecial(sql){
    return sql.replace('$$PATH$$', current + path.sep);
}


function findSql(obj, list){
    if(obj && typeof obj === 'object'){
        if(obj.code === 655 || obj.code === 356){
            const param = obj.parameters[0];
            if(param.slice(0, 3) === 'sql'){
                const sql = param.slice(4);
                if(!list.find(item=>item[0] === sql)){
                    list.push([sql, alasql.promise(replaceSpecial(sql))]);
                }
            }
        }

        Object.keys(obj).forEach(key=>findSql(obj[key], list));
    }
}


try {
    let dataList = fs.readdirSync(path.join(current, 'data'));
    let sqlList = [];
    dataList.forEach(fileName => {
        if (fileName.slice(-5) === '.json') {
            const json = fs.readFileSync(path.join(current, 'data', fileName));
            findSql(JSON.parse(json), sqlList);
        }
    });

    window.__liply_DatabaseDevelopment = Promise
        .all(sqlList.map(tuple=>tuple[1]))
        .then(results=>{
            let data = {};
            results.forEach((result, n)=>{
                data[sqlList[n][0]] = result;
            });
            fs.writeFileSync(path.join(current, 'data', 'Database.json'), JSON.stringify(data));
        });


}catch(e){
    console.error(e.stack);
    error = e;
}