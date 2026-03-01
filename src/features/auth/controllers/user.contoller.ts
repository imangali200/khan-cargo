import { Controller, Patch, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { UserService } from "../services/user.service";
import { UploadService } from "src/features/upload/upload.service";
import { Auth } from "src/core/decorators/auth.decorators";
import { CurrentUser } from "src/core/decorators/current-user.decorator";
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from "@nestjs/swagger";

@ApiTags('Profile')
@Controller('user')
export class UserController {
    constructor(
        private readonly userService: UserService,
        private readonly uploadService: UploadService
    ) { }

    @Patch('profile-photo')
    @Auth([])
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                photo: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    })
    @ApiOperation({ summary: 'Update profile photo' })
    @UseInterceptors(FileInterceptor('photo'))
    async setProfilePhoto(
        @UploadedFile() photo: Express.Multer.File,
        @CurrentUser('sub') userId: number
    ) {
        const user = await this.userService.findUser(userId);

        const { url, publicId } = await this.uploadService.uploadImage(photo);

        if (user.profilePhotoPublicId) {
            await this.uploadService.deleteImage(user.profilePhotoPublicId);
        }

        return await this.userService.updateProfilePhoto(userId, url, publicId);
    }
}