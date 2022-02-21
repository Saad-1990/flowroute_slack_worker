

export abstract class Utils {

    public static async Sleep(ms: number) {
        return new Promise((resolve: any, reject: any) => {
            setTimeout(() => {
                resolve()
            }, ms);
        })
    }
}