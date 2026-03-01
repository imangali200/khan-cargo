import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBody, ApiConsumes, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { Auth } from "src/core/decorators/auth.decorators";
import { CurrentUser } from "src/core/decorators/current-user.decorator";
import { UserRoles } from "src/core/db/enums/user_roles";
import { FeedService } from "./feed.service";
import { CreatePostDto } from "./dto/create-post.dto";
import { CreateCommentDto } from "./dto/create-comment.dto";
import { UploadService } from "../upload/upload.service";

@Controller('feed')
@ApiTags('Feed')
export class FeedController {
    constructor(
        private readonly feedService: FeedService,
        private readonly uploadService: UploadService,
    ) { }

    @Get()
    @Auth([])
    @ApiOperation({ summary: 'Get feed (branch-scoped, SUPERADMIN sees all)' })
    @ApiQuery({ name: 'page', required: false, example: 1 })
    @ApiQuery({ name: 'limit', required: false, example: 20 })
    async getFeed(
        @CurrentUser() user: any,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
    ) {
        return this.feedService.getFeed(user, page ? Number(page) : 1, limit ? Number(limit) : 20);
    }

    @Post('posts')
    @Auth([UserRoles.USER, UserRoles.ADMIN, UserRoles.SUPERADMIN])
    @UseInterceptors(FileInterceptor('image'))
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                content: { type: 'string' },
                externalLink: { type: 'string' },
                price: { type: 'number' },
                image: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    })
    @ApiOperation({ summary: 'Create post' })
    async createPost(
        @Body() dto: CreatePostDto,
        @CurrentUser() user: any,
        @UploadedFile() file?: Express.Multer.File,
    ) {
        if (file) {
            const { url, publicId } = await this.uploadService.uploadImage(file);
            dto.imageUrl = url;
            dto.imagePublicId = publicId;
        }
        return this.feedService.createPost(dto, user);
    }

    @Get('posts/:search')
    @Auth([UserRoles.USER, UserRoles.ADMIN, UserRoles.SUPERADMIN])
    @ApiOperation({ summary: 'Get post by ID' })
    async getPost(@Param('search') search: string) {
        return this.feedService.getPost(search);
    }

    @Delete('posts/:id')
    @Auth([UserRoles.USER, UserRoles.ADMIN, UserRoles.SUPERADMIN])
    @ApiOperation({ summary: 'Delete post (author, branch admin, or superadmin)' })
    async deletePost(@Param('id') id: number, @CurrentUser() user: any) {
        return this.feedService.deletePost(id, user);
    }

    @Post('posts/:id/like')
    @Auth([UserRoles.USER, UserRoles.ADMIN, UserRoles.SUPERADMIN])
    @ApiOperation({ summary: 'Toggle like on post' })
    async toggleLike(@Param('id') id: number, @CurrentUser('sub') userId: number) {
        return this.feedService.toggleLike(id, userId);
    }


    @Get('posts/:postId/comments')
    @Auth([UserRoles.USER, UserRoles.ADMIN, UserRoles.SUPERADMIN])
    @ApiOperation({ summary: 'Get comments for a post' })
    async getComments(
        @Param('postId') postId: number,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
    ) {
        return this.feedService.getComments(postId, page ? Number(page) : 1, limit ? Number(limit) : 20);
    }

    @Post('posts/:postId/comments')
    @Auth([UserRoles.USER, UserRoles.ADMIN, UserRoles.SUPERADMIN])
    @ApiOperation({ summary: 'Create comment on a post' })
    async createComment(
        @Param('postId') postId: number,
        @Body() dto: CreateCommentDto,
        @CurrentUser() user: any,
    ) {
        return this.feedService.createComment(postId, dto, user);
    }

    @Delete('comments/:id')
    @Auth([UserRoles.USER, UserRoles.SUPERADMIN])
    @ApiOperation({ summary: 'Delete comment (author, or superadmin)' })
    async deleteComment(@Param('id') id: number, @CurrentUser() user: any) {
        return this.feedService.deleteComment(id, user);
    }
}
