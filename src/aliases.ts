import moduleAlias from "module-alias"

moduleAlias.addAliases({
  "@root": `${__dirname}/`,
  "@api": `${__dirname}/api/`,
  "@database": `${__dirname}/database/`,
  "@interfaces": `${__dirname}/interfaces/`,
  "@helpers": `${__dirname}/helpers/`
})
