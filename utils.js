// NPM requires
const chalk = require("chalk");
const fs = require("fs");
const format = require("date-fns/format");
const md5 = require("md5");

// Files requires
const config = require("./config.json");

// Error handler private utils
/**
 * @param [fileName="null"] {String} Arquivo onde ocorreu o erro
 * @param [IDs] {Object} IDs involvidos
 * @param [IDs.server=0] {String|Number} ID do server
 * @param [IDs.user=0] {String|Number} ID do usuario
 * @param [IDs.msg=0] {String|Number} ID da mensagem
 */
function generateErrorID(fileName = "null", IDs = { server: 0, user: 0, msg: 0 }) {
  let errorID = `${fileName}_${module.exports.formatDate(new Date())}_${IDs.server}-${IDs.user}-${IDs.msg}`;
  errorID = md5(errorID);
  return errorID;
}

//--------------------------------------------------------------------------------------------------//
// Exports
module.exports = {
  //--------------------------------------------------------------------------------------------------//
  //#region Chalk config

  chalkClient: {
    chalk: chalk,
    error: chalk.bold.red,
    warn: chalk.bold.keyword('orange'),
    ok: chalk.bold.green
  },

  //#endregion
  //--------------------------------------------------------------------------------------------------//
  //#region Mix utils

  /**
   * Checa se o usuario do ID fornecido faz parte do time de desenvolvedores
   * @param ID {String|Number} ID do usuario para checar
   * @returns {Boolean}
   */
  isDev: (ID) => {
    if (config.devsID.includes(ID)) return true;
    return false;
  },

  /**
   * Checa se o usuario do ID fornecido faz parte do time de desenvolvedores
   * @param ID {String|Number} ID do usuario para checar
   * @returns {Boolean}
   */
  isTester: (ID) => {
    if (config.testersID.includes(ID)) return true;
    return false;
  },

  /**
   * Formata datas no estilo dd/MM/yyyy HH:mm:SS
   * @param date {Date} Data para formatar
   * @returns {String} Data formatada no estilo dd/MM/yyyy HH:mm:SS
   */
  formatDate: (date) => {
    return format(date - 10800000, "dd/MM/yyyy HH:mm:ss");
  },

  /**
   * Timer
   * @param ms {Number} Quantidade de tempo em milisegundos
   */
  sleep: (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  /**
   * Retorna uma pagina
   * @param {TextChannel} channel - o canal onde vai ser enviado 
   * @param {Number} size - quantidade de paginas
   * @param {Callback} Callback - a função realizada por pagina 
   */
  createPage: (channel, size, func) => {
    let page = 1;

    channel.send(func(1) || 'nill').then(msg => {
      if (size == 1) return;
      msg.react('⬅️').then(() => {
        msg.react('➡️')

        const filter = (reaction, user) => {
          return ['➡️', '⬅️'].includes(reaction.emoji.name) && !user.bot
        };

        let collector = msg.createReactionCollector(filter, { idle: 30000 });

        collector.on("collect", r => {
          page = (page + (r.emoji.name == '➡️' ? 0 : size - 2)) % size + 1;

          msg.edit(func(page) || 'nill');
          msg.reactions.cache.each(react => {
            react.users.cache.filter(u => !u.bot).each(u => {
              react.users.remove(u.id);
            });
          });

        })

        collector.on("end", collected => {
          if (collected.size > 0) return;
          msg.reactions.removeAll();
        });

      }).catch(err => console.log(err))
    })

  },

  //#endregion
  //--------------------------------------------------------------------------------------------------//
  //#region Handler utils

  /**
   * Checa se o caminho fornecido é uma pasta/diretorio
   * @param {String} path Caminho para o diretorio a ser checado
   * @returns {Boolean}
   */
  isDir: (path) => {
    try {
      var stat = fs.lstatSync(path);
      return stat.isDirectory();
    } catch (e) {
      return false;
    }
  },

  //#endregion
  //--------------------------------------------------------------------------------------------------//
  //#region Error handler utils

  /**
   * Cria o log de um novo erro
   * @param err {Error} Erro que aconteceu
   * @param [fileName=null] {String} Nome do arquivo onde que aconteceu o erro
   * @param [IDs=null] {Object} IDs relacionados ao erro
   * @param [IDs.server=null] {String|Number} ID do server
   * @param [IDs.user=null] {String|Number} ID do usuario
   * @param [IDs.msg=null] {String|Number} ID da mensagem
   * @returns {String} String para logar no console
   */
  newError: (err, fileName = "null", IDs = { server: null, user: null, msg: null }) => {
    if (!err) return;
    let folder = fs.existsSync('./errors');
    fileName = fileName.split('.')[0];
    let errorFileName = `${fileName ? fileName + "_" : ""}${format(new Date() - 10800000, "dd:MM:yyyy_HH:mm:ss")}.json`;
    let dados = {
      errorID: generateErrorID(fileName, IDs),
      msdate: Number(new Date()),
      date: module.exports.formatDate(new Date()),
      msg: err.message || null,
      stack: err.stack || null,
      IDs: IDs || null,
      thisfile: errorFileName
    };
    if (!folder) {
      fs.mkdirSync('./errors');
    }
    fs.writeFileSync(`./errors/${errorFileName}`, JSON.stringify(dados, null, 2), { encoding: 'utf8' });
    return `${chalkClient.error('Erro detectado!')}\nVeja o log em: ./errors/${errorFileName}`;
  },

  /**
   * Lista todos os erros
   * @returns {Array} Array com os arquivos dos erros
   */
  listErrors: () => {
    if (!fs.existsSync("./errors")) return [];
    return fs.readdirSync("./errors");
  },

  /**
   * Procura um erro usando o ID
   * @param errorID {String|Number} ID do erro
   * @returns {Object}
   */
  searchErrorByID: (errorID) => {
    let errorFolder = module.exports.listErrors();
    let errorSearched = errorFolder.filter(errorFile => {
      let errorData = require(`./errors/${errorFile}`);
      return errorData.errorID == errorID;
    });
    if (errorSearched.length > 0) {
      errorSearched = errorSearched[0];
    } else {
      errorSearched = null;
    }
    return errorSearched;
  },

  /**
   * Limpa todos os erros
   */
  clearAllErrors: () => {
    let errorFolder = module.exports.listErrors();
    errorFolder.forEach(errorFile => {
      fs.unlink(`./errors/${errorFile}`, (err) => { if (err) console.log("=> " + newError(err, errorFile)); });
    });
    return;
  },

  /**
   * Deleta um unico arquivo da pasta "errors"
   * @param file {String} Arquivo para excluir
   */
  deleteError: (file) => {
    let path = `./errors/${file}`;
    if (!file || !fs.existsSync(path)) throw new Error('Arquivo invalido!');
    fs.unlink(path, (err) => { if (err) console.log("\n=> " + newError(err, file)); });
    return;
  },

  //#endregion
  //--------------------------------------------------------------------------------------------------//
  //#region Json utils

  /**
   * transforma um objeto em um .json
   * @param path {String} Caminho para o json a ser criado/substituido
   * @param object {Any}
   */
  jsonPush: (path, object) => {
    var data = JSON.stringify(object, null, 2);
    fs.writeFileSync(path, data, (err) => {
      if (err) throw err;
    });
    return false;
  },

  /**
   * transforma um .json em um objeto
   * @param path {String} Caminho para o json a ser transformado
   * @returns {object} 
   */
  jsonPull: (path) => {
    if (!(typeof path == "string" && path.endsWith('.json') && fs.existsSync(path))) return null;
    var data = fs.readFileSync(path);
    return JSON.parse(data);
  },

  /**
   * Pega um .json e utiliza em uma função
   * @param path {String} Caminho para o json usado
   * @param func {function} função para utilizar o func
   * @param min  {number} numero de segurança, se o objeto retornado tiver um tamanho menor, vai dar erro
   * obs. Se voce for usar esse comando só pra editar/adicionar json,
   * e nunca vai remover algo dele coloca no lugar de min o booleano true.
   */
  jsonChange: async (path, func, min = 0) => {
    let bal = module.exports.jsonPull(path);

    if (!bal) return console.log(`=> ${module.exports.newError(new Error('Não foi encontrado um json no caminho inserido'), "utils_jsonChange")}`);;

    const ret = func(bal);
    min = (typeof min == 'boolean' && min) ? Object.keys(bal).length : min;

    if (typeof ret === 'object' && ret !== null) {

      if (Object.keys(ret).length >= min) {

        await module.exports.jsonPush(path, ret);

      } else {
        console.log(`=> ${module.exports.newError(new Error(`O tamanho do objeto (${Object.keys(ret).length}) foi menor que o esperado (${min})`), "utils_jsonChange")}`);
      }
    };
  },
  //#endregion
}