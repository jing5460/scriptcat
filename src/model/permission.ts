import { db, Model } from '@App/model/model';
import { Permission } from './do/permission';

export class PermissionModel extends Model<Permission> {

    public tableName = 'permission';

    constructor() {
        super();
        this.table = db.table(this.tableName);
    }

}

