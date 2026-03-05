import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersController } from './controllers/users.controller';
import { UserBlockingController } from './controllers/user-blocking.controller';
import { UserBlockingService } from './services/user-blocking.service';
import { UsersService } from './services/users.service';
import { User, UserSchema } from './schemas/user.schema';
import { Astrologer, AstrologerSchema } from '../astrologers/schemas/astrologer.schema';
import { AuthModule } from '../auth/auth.module'; // ✅ ADD

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Astrologer.name, schema: AstrologerSchema },
    ]),
    AuthModule, // ✅ ADD
  ],
  controllers: [UsersController, UserBlockingController],
  providers: [UsersService, UserBlockingService],
  exports: [UsersService, MongooseModule, UserBlockingService], // ✅ Export UserBlockingService
})
export class UsersModule { }
