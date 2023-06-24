import axios from "axios"

import config from "@root/config"

abstract class ApiBase {
    private client = axios.create({baseURL: config.musixmatchHost ,timeout: 1000, params: {apikey: config.musixmatchKey}})

    protected async get<T>(url: string, params: any): Promise<T | null> {
        try {
            const response = await this.client.get(url, params)
            if(!response.data?.message?.body) return null

            return response.data.message.body
        } catch (error) {
            console.error(error)
            return null
        }
    }
}

export default ApiBase