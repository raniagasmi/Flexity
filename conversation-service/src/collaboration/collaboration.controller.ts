import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { CollaborationService } from './collaboration.service';
import type { ApproveProposalDto, CreateConversationDto, SendMessageDto } from './dto/create-conversation.dto';
import type { UpdateProposalScheduleDto } from './dto/update-proposal-schedule.dto';

@Controller('collaboration')
export class CollaborationController {
  constructor(private readonly collaborationService: CollaborationService) {}

  @Post('conversations')
  createConversation(@Body() body: CreateConversationDto) {
    return this.collaborationService.createConversation(body, body.adminId ?? '');
  }

  @Get('conversations/user/:userId')
  getConversationsForUser(@Param('userId') userId: string) {
    return this.collaborationService.getConversationsForUser(userId);
  }

  @Get('conversations')
  getAllConversations() {
    return this.collaborationService.getAllConversations();
  }

  @Get('conversations/:id/messages')
  getMessages(@Param('id') id: string) {
    return this.collaborationService.getMessages(id);
  }

  @Post('conversations/:id/messages')
  sendMessage(@Param('id') id: string, @Body() body: SendMessageDto) {
    return this.collaborationService.sendMessage(id, body);
  }

  @Post('conversations/:id/ai-decompose')
  decompose(@Param('id') id: string, @Body() body: ApproveProposalDto) {
    return this.collaborationService.runAiDecomposition(id, body.adminId);
  }

  @Get('conversations/:id/gantt')
  getGantt(@Param('id') id: string) {
    return this.collaborationService.getConversationGantt(id);
  }

  @Patch('proposals/:id/schedule')
  updateSchedule(@Param('id') id: string, @Body() body: UpdateProposalScheduleDto) {
    return this.collaborationService.updateProposalSchedule(id, body);
  }

  @Post('proposals/:id/approve')
  approve(@Param('id') id: string, @Body() body: ApproveProposalDto) {
    return this.collaborationService.approveProposal(id, body.adminId);
  }

  @Post('proposals/:id/reject')
  reject(@Param('id') id: string, @Body() body: ApproveProposalDto) {
    return this.collaborationService.rejectProposal(id, body.adminId);
  }
}
