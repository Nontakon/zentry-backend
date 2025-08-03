import { Module, Provider, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import neo4j, { Driver } from 'neo4j-driver';
import { OGM } from '@neo4j/graphql-ogm';
import { typeDefs } from './type-defs/type-defs';

export const NEO4J_DRIVER = 'NEO4J_DRIVER';
export const NEO4J_OGM = 'NEO4J_OGM';

const driverProvider: Provider = {
    provide: NEO4J_DRIVER,
    useFactory: (configService: ConfigService) => 
        neo4j.driver(
            configService.get<string>('NEO4J_URI')|| '', 
            neo4j.auth.basic(
                configService.get<string>('NEO4J_USERNAME')|| '', 
                configService.get<string>('NEO4J_PASSWORD')|| ''
            )
        ),
    inject: [ConfigService],
};
const ogmProvider: Provider = {
    provide: NEO4J_OGM,
    useFactory: async (driver: Driver) => {
        const ogm = new OGM({ typeDefs, driver });
        await ogm.init();
        return ogm;
    },
    inject: [NEO4J_DRIVER],
};

@Global()
@Module({
  imports: [ConfigModule],
  providers: [driverProvider, ogmProvider],
  exports: [ogmProvider, driverProvider],
})
export class DatabaseModule {}