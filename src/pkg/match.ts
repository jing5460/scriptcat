
export class Match<T> {
    protected cache = new Map<string, T[]>();
    protected rule = new Map<string, T[]>();

    protected parseURL(url: string): Url | undefined {
        let match = /^(.+?):\/\/(.*?)((\/.*?)(\?.*?|)|)$/.exec(url);
        if (match) {
            return {
                scheme: match[1],
                host: match[2],
                path: match[4] || '/',
                search: match[5],
            };
        }
        if (url == 'http*') {
            return { scheme: '*', host: '*', path: '*', search: '*' };
        }
        match = /^(.*?)((\/.*?)(\?.*?|)|)$/.exec(url);
        if (match) {
            return {
                scheme: '*',
                host: match[1],
                path: match[3] || '/',
                search: match[4],
            };
        }
        return undefined;
    }

    protected compileRe(url: string): string {
        const u = this.parseURL(url);
        if (!u) {
            return '';
        }
        switch (u.scheme) {
            case '*':
                u.scheme = '.+?';
                break;
            case 'http*':
                u.scheme = 'http[s]';
                break;
        }
        u.host = u.host.replace(/\*/g, '[^/]*?');
        // 处理 *.开头
        if (u.host.startsWith('[^/]*?.')) {
            u.host = '([^/]*?\.?)' + u.host.substr(7);
        }
        // 处理顶域
        if (u.host.endsWith('tld')) {
            u.host = u.host.substr(0, u.host.length - 3) + '.*?';
        }
        let re = `^${u.scheme}://${u.host}`;
        if (u.path == '/') {
            re += '[/]?';
        } else {
            re += u.path.replace(/\*/g, '.*?');
        }
        if (u.search) {
            re += u.search.replace(/([\?])/g, '\\$1').replace(/\*/g, '.*?');
        }
        return re.replace(/\//g, '\/') + '$';
    }

    public add(url: string, val: T) {
        const re = this.compileRe(url);
        if (!re) {
            return;
        }
        let rule = this.rule.get(re);
        if (!rule) {
            rule = [];
            this.rule.set(re, rule);
        }
        rule.push(val);
        this.delCache();
    }

    public match(url: string): T[] {
        let ret = this.cache.get(url);
        if (ret) {
            return ret;
        }
        ret = [];
        this.rule.forEach((val, key) => {
            try {
                const re = new RegExp(key);
                if (re.test(url)) {
                    ret && ret.push(...val);
                }
            } catch (_) {

            }
        });
        this.cache.set(url, ret);
        return ret;
    }

    protected getId(val: T): string {
        if (typeof val == 'object') {
            return (<{ id: string }><unknown>val).id;
        }
        return <string><unknown>val;
    }

    public del(val: T) {
        const id = this.getId(val);
        this.rule.forEach((rule, key) => {
            const tmp: T[] = [];
            rule.forEach(val => {
                if (this.getId(val) != id) {
                    tmp.push(val);
                }
            })
            if (tmp) {
                this.rule.set(key, tmp);
            } else {
                this.rule.delete(key);
            }
        });
        this.delCache();
    }

    protected delCache() {
        this.cache.clear();
    }

}

export class UrlMatch<T> extends Match<T>{
    protected excludeMatch = new Match<T>();

    public exclude(url: string, val: T) {
        this.excludeMatch.add(url, val);
    }

    public del(val: T): void {
        super.del(val);
        this.cache.clear();
    }

    public match(url: string): T[] {
        const cache = this.cache.get(url);
        if (cache) {
            return cache;
        }
        let ret = super.match(url);
        // 排除
        const includeMap = new Map();
        ret.forEach(val => {
            includeMap.set(this.getId(val), val);
        })
        const exclude = this.excludeMatch.match(url);
        const excludeMap = new Map();
        exclude.forEach(val => {
            excludeMap.set(this.getId(val), 1);
        })
        ret = [];
        includeMap.forEach((val: T, key) => {
            if (!excludeMap.has(key)) {
                ret.push(val);
            }
        })
        this.cache.set(url, ret);
        return ret;
    }

}

export interface Url {
    scheme: string;
    host: string;
    path: string;
    search: string;
}

