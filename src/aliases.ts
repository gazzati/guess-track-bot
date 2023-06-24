import moduleAlias from "module-alias"

moduleAlias.addAliases({
  "@root": `${__dirname}/`,
  "@api": `${__dirname}/api/`,
  "@interfaces": `${__dirname}/interfaces/`
})
